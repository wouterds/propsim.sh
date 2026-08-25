import {
  sendAccountDeleted,
  sendConfirmNewEmail,
  sendEmailChanging,
  sendPasswordChanged,
} from "@propsim/mail";
import { scrubUser } from "@propsim/users";
import { useEffect, useRef } from "react";
import { data, Form, href, Link, useNavigation } from "react-router";
import DeleteAccount from "~/components/settings/delete-account";
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
import { PRIVATE } from "~/lib/seo";
import { listSessions, revokeOtherSessions, revokeSession } from "~/lib/sessions.server";
import { findUserByEmail, findUserById, updatePassword } from "~/lib/users.server";
import type { Route } from "./+types/settings";

export const meta: Route.MetaFunction = () => [{ title: "Settings, propsim.sh" }, ...PRIVATE];

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

  return {
    email: user.email,
    hasPassword: user.password !== null,
    sessions: rows.map((row) => asRow(row, session.id, now)),
  };
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

    // Google only, so there is nothing to check against and nothing to change.
    if (!user.password) {
      return { done: null, error: "This account has no password. Set one from the reset link." };
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

    // An account with no password is asked for none: the session is what says
    // who this is, and the new address still has to confirm by link.
    if (user.password && !(await verifyPassword(current, user.password))) {
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

  if (intent === "delete") {
    const typed = String(form.get("email") ?? "")
      .trim()
      .toLowerCase();

    // The address is the confirmation, so a stray submit cannot end an account.
    if (typed !== user.email.toLowerCase()) {
      return { done: null, error: "That is not the address on this account." };
    }

    // Sent while there is still somewhere to send it, and through notify: a
    // provider outage must not leave the account half deleted.
    await notify(() => sendAccountDeleted({ to: user.email }));
    await scrubUser(user.id);

    throw await endSession(request);
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
  const emailForm = useRef<HTMLFormElement>(null);
  const passwordForm = useRef<HTMLFormElement>(null);

  // Which form is in flight, not whether any of them is: one page wide flag
  // greys out every button on the page while a single one is working.
  const sending = navigation.state === "idle" ? null : navigation.formData;
  const intent = sending?.get("intent")?.toString() ?? null;
  const busy = (name: string) => intent === name;
  const revoking = intent === "revoke" ? (sending?.get("session")?.toString() ?? null) : null;

  // Uncontrolled inputs keep what was typed unless something empties them, and
  // a password left sitting in a field is worse than the retyping.
  useEffect(() => {
    if (!actionData?.done) {
      return;
    }

    emailForm.current?.reset();
    passwordForm.current?.reset();
  }, [actionData]);

  const { email, hasPassword, sessions } = loaderData;
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
          <Form ref={emailForm} method="post" className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="intent" value="email" />
            <Field name="email" label="New address" type="email" autoComplete="email" />
            <Field name="confirm" label="Confirm new address" type="email" autoComplete="off" />
            {hasPassword && (
              <>
                <Field
                  name="current"
                  label="Current password"
                  type="password"
                  autoComplete="current-password"
                />
                <div className="hidden sm:block" />
              </>
            )}
            <div className="sm:col-span-2">
              <button type="submit" disabled={busy("email")} className={PRIMARY_SM}>
                {busy("email") ? "One moment" : "Send the link"}
              </button>
            </div>
          </Form>
        </Section>

        <Section
          title="Password"
          description={
            hasPassword
              ? "Changing it signs out every other device. This one stays signed in."
              : "This account signs in with Google, so there is no password on it."
          }
        >
          {hasPassword ? (
            <Form ref={passwordForm} method="post" className="grid gap-4 sm:grid-cols-2">
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
                <button type="submit" disabled={busy("password")} className={PRIMARY_SM}>
                  {busy("password") ? "One moment" : "Change the password"}
                </button>
              </div>
            </Form>
          ) : (
            <>
              <p className="text-muted text-sm leading-relaxed">
                Sending yourself a reset link is how you set one. After that you can sign in either
                way.
              </p>
              <Link to={href("/forgot")} className={`mt-4 ${SECONDARY_SM}`}>
                Set a password
              </Link>
            </>
          )}
        </Section>

        <Section
          title="Where you are signed in"
          description="A place is worked out from the network the device is on."
        >
          <SessionList sessions={sessions} revoking={revoking} />

          {others > 0 && (
            <Form method="post" className="mt-4 border-line/60 border-t pt-4">
              <input type="hidden" name="intent" value="revoke-others" />
              <button type="submit" disabled={busy("revoke-others")} className={SECONDARY_SM}>
                {busy("revoke-others") ? "One moment" : `Sign out everywhere else (${others})`}
              </button>
            </Form>
          )}
        </Section>
        <Section
          title="Delete this account"
          description="Everything goes and nothing comes back. You are asked to type the address first."
        >
          <DeleteAccount email={email} busy={busy("delete")} />
        </Section>
      </div>
    </main>
  );
};

export default Settings;
