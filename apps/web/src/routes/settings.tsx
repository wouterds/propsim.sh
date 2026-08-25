import { sendConfirmNewEmail, sendEmailChanging, sendPasswordChanged } from "@propsim/mail";
import { data, Form, useNavigation } from "react-router";
import Field from "~/components/settings/field";
import Notice from "~/components/settings/notice";
import Section from "~/components/settings/section";
import SessionList, { type SessionRow } from "~/components/settings/session-list";
import { PRIMARY_SM, SECONDARY_SM } from "~/components/ui/button";
import { endSession, requireSession, rotateSession } from "~/lib/auth.server";
import { describeDevice } from "~/lib/device";
import { issueEmailChange } from "~/lib/email-changes.server";
import { countryOf, formatDate, formatRelative } from "~/lib/format";
import { notify } from "~/lib/notify.server";
import { hashPassword, verifyPassword } from "~/lib/password.server";
import { EMAIL_CHANGE_TTL_MINUTES, MIN_PASSWORD } from "~/lib/policy";
import { listSessions, revokeOtherSessions, revokeSession } from "~/lib/sessions.server";
import { findUserByEmail, findUserById, updatePassword } from "~/lib/users.server";
import type { Route } from "./+types/settings";

export const meta: Route.MetaFunction = () => [{ title: "Settings, propsim.sh" }];

const asRow = (
  row: Awaited<ReturnType<typeof listSessions>>[number],
  currentId: string,
  now: Date,
): SessionRow => {
  const country = countryOf(row.country);

  return {
    id: row.id,
    current: row.id === currentId,
    label: describeDevice(row),
    kind: row.kind,
    place: country ? `${country.flag} ${country.name}` : null,
    lastSeen: formatRelative(row.lastSeenAt, now),
    since: formatDate(row.createdAt.toISOString().slice(0, 10)),
  };
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const session = await requireSession(request);
  const user = await findUserById(session.userId);

  if (!user) {
    throw await endSession(request);
  }

  const now = new Date();
  const rows = await listSessions(session.userId);

  return { email: user.email, sessions: rows.map((row) => asRow(row, session.id, now)) };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const session = await requireSession(request);
  const user = await findUserById(session.userId);

  if (!user) {
    throw await endSession(request);
  }

  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "password") {
    const current = String(form.get("current") ?? "");
    const next = String(form.get("password") ?? "");

    if (next.length < MIN_PASSWORD) {
      return { done: null, error: `Use at least ${MIN_PASSWORD} characters.` };
    }

    if (next !== String(form.get("confirm") ?? "")) {
      return { done: null, error: "The two new passwords do not match." };
    }

    if (!(await verifyPassword(current, user.password))) {
      return { done: null, error: "That is not your current password." };
    }

    await updatePassword(user.id, await hashPassword(next));
    await revokeOtherSessions(user.id, session.id, "password_change");
    await notify(() => sendPasswordChanged({ to: user.email }));

    const cookie = await rotateSession(request, session, "password_change");

    return data(
      { done: "Your password was changed and every other device was signed out.", error: null },
      { headers: { "Set-Cookie": cookie } },
    );
  }

  if (intent === "email") {
    const email = String(form.get("email") ?? "")
      .trim()
      .toLowerCase();
    const current = String(form.get("current") ?? "");

    if (!email || email === user.email) {
      return { done: null, error: "That is already the address on this account." };
    }

    if (
      email !==
      String(form.get("confirm") ?? "")
        .trim()
        .toLowerCase()
    ) {
      return { done: null, error: "The two addresses do not match." };
    }

    if (!(await verifyPassword(current, user.password))) {
      return { done: null, error: "That is not your current password." };
    }

    // Silent when the address is taken, or this says which addresses exist.
    if (!(await findUserByEmail(email))) {
      const token = await issueEmailChange(user.id, email);

      await notify(() =>
        sendConfirmNewEmail({ to: email, token, expiresInMinutes: EMAIL_CHANGE_TTL_MINUTES }),
      );
      await notify(() => sendEmailChanging({ to: user.email, email }));
    }

    return {
      done: `If ${email} can receive mail, a link to confirm it is on the way.`,
      error: null,
    };
  }

  if (intent === "revoke-others") {
    await revokeOtherSessions(session.userId, session.id, "revoked");

    return { done: "Signed out everywhere else.", error: null };
  }

  const id = String(form.get("session") ?? "");

  if (!id || id === session.id) {
    return { done: null, error: "Use log out to close this device." };
  }

  await revokeSession(session.userId, id, "revoked");

  return { done: "Signed out of that device.", error: null };
};

const Settings = ({ loaderData, actionData }: Route.ComponentProps) => {
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";
  const { email, sessions } = loaderData;
  const others = sessions.filter((session) => !session.current).length;

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-8 sm:px-8">
      <h1 className="font-semibold text-ink text-xl tracking-tight">Settings</h1>
      <p className="mt-1 text-faint text-xs">{email}</p>

      <div className="mt-6 grid gap-3">
        <Notice done={actionData?.done} error={actionData?.error} />

        <Section
          title="Email address"
          description="The account keeps this address until the new one confirms. Both are told."
        >
          <Form method="post" className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="intent" value="email" />
            <Field name="email" label="New address" type="email" autoComplete="email" />
            <Field name="confirm" label="Confirm new address" type="email" autoComplete="off" />
            <Field
              name="current"
              label="Current password"
              type="password"
              autoComplete="current-password"
            />
            <div className="hidden sm:block" />
            <div className="sm:col-span-2">
              <button type="submit" disabled={busy} className={PRIMARY_SM}>
                {busy ? "One moment" : "Send the confirmation"}
              </button>
            </div>
          </Form>
        </Section>

        <Section
          title="Password"
          description="Changing it signs out every other device. This one stays signed in."
        >
          <Form method="post" className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="intent" value="password" />
            <Field
              name="password"
              label="New password"
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD}
            />
            <Field
              name="confirm"
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD}
            />
            <Field
              name="current"
              label="Current password"
              type="password"
              autoComplete="current-password"
            />
            <div className="hidden sm:block" />
            <div className="sm:col-span-2">
              <button type="submit" disabled={busy} className={PRIMARY_SM}>
                {busy ? "One moment" : "Change the password"}
              </button>
            </div>
          </Form>
        </Section>

        <Section
          title="Where you are signed in"
          description="A place is worked out from the network the device is on."
        >
          <SessionList sessions={sessions} busy={busy} />

          {others > 0 && (
            <Form method="post" className="mt-4 border-line/60 border-t pt-4">
              <input type="hidden" name="intent" value="revoke-others" />
              <button type="submit" disabled={busy} className={SECONDARY_SM}>
                {busy ? "One moment" : `Sign out everywhere else (${others})`}
              </button>
            </Form>
          )}
        </Section>
      </div>
    </main>
  );
};

export default Settings;
