import { Form, useNavigation } from "react-router";
import Section from "~/components/settings/section";
import SessionList, { type SessionRow } from "~/components/settings/session-list";
import { endSession, requireSession } from "~/lib/auth.server";
import { describeDevice } from "~/lib/device";
import { countryOf, formatDate, formatRelative } from "~/lib/format";
import { listSessions, revokeOtherSessions, revokeSession } from "~/lib/sessions.server";
import { findUserById } from "~/lib/users.server";
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
  const form = await request.formData();

  if (form.get("intent") === "revoke-others") {
    await revokeOtherSessions(session.userId, session.id, "revoked");

    return { done: "Signed out everywhere else." };
  }

  const id = String(form.get("session") ?? "");

  if (!id || id === session.id) {
    return { error: "Use log out to close this device." };
  }

  await revokeSession(session.userId, id, "revoked");

  return { done: "Signed out of that device." };
};

const Account = ({ loaderData, actionData }: Route.ComponentProps) => {
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";
  const { email, sessions } = loaderData;
  const others = sessions.filter((session) => !session.current).length;

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-8 sm:px-8">
      <h1 className="font-semibold text-ink text-xl tracking-tight">Settings</h1>
      <p className="mt-1 text-faint text-xs">{email}</p>

      <div className="mt-6 grid gap-3">
        <Section
          title="Where you are signed in"
          description="A place is worked out from the network the device is on, so it can name the wrong city and the right country."
        >
          {actionData?.done && (
            <p className="mb-3 rounded border border-up/40 bg-up/10 px-3 py-2 text-sm text-up">
              {actionData.done}
            </p>
          )}
          {actionData?.error && (
            <p
              role="alert"
              className="mb-3 rounded border border-down/40 bg-down/10 px-3 py-2 text-down text-sm"
            >
              {actionData.error}
            </p>
          )}

          <SessionList sessions={sessions} busy={busy} />

          {others > 0 && (
            <Form method="post" className="mt-4 border-line/60 border-t pt-4">
              <input type="hidden" name="intent" value="revoke-others" />
              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-9 items-center rounded border border-line px-4 text-muted text-sm transition-colors hover:border-line-strong hover:text-ink focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-60"
              >
                {busy ? "One moment" : `Sign out everywhere else (${others})`}
              </button>
            </Form>
          )}
        </Section>
      </div>
    </main>
  );
};

export default Account;
