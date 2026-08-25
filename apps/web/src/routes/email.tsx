import { Form, href, Link, useNavigation } from "react-router";
import AuthShell from "~/components/auth/auth-shell";
import { consumeEmailChange } from "~/lib/email-changes.server";
import { revokeAllSessions } from "~/lib/sessions.server";
import { updateEmail } from "~/lib/users.server";
import type { Route } from "./+types/email";

export const meta: Route.MetaFunction = () => [{ title: "Confirm your address, propsim.sh" }];

const tokenOf = (request: Request) => new URL(request.url).searchParams.get("token") ?? "";

// Opening the link consumes nothing. A mail scanner must not move an account.
export const loader = ({ request }: Route.LoaderArgs) => ({ token: tokenOf(request) });

export const action = async ({ request }: Route.ActionArgs) => {
  const change = await consumeEmailChange(tokenOf(request));

  if (!change) {
    return { error: "That link has been used already or has expired." };
  }

  await updateEmail(change.userId, change.email);
  await revokeAllSessions(change.userId, "email_change");

  return { email: change.email };
};

const Email = ({ loaderData, actionData }: Route.ComponentProps) => {
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  if (actionData && "email" in actionData) {
    return (
      <AuthShell>
        <h1 className="font-semibold text-ink text-lg tracking-tight">Address confirmed</h1>
        <p className="mt-2 text-muted text-sm leading-relaxed">
          Your account now uses {actionData.email}. Every device has been signed out, so sign in
          again with the new address.
        </p>
        <Link
          to={href("/auth")}
          className="mt-6 inline-flex h-10 items-center rounded bg-accent-strong px-4 font-medium text-sm text-ink transition-colors hover:bg-accent-strong/85 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
        >
          Log in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="font-semibold text-ink text-lg tracking-tight">Confirm this address</h1>
      <p className="mt-1 mb-6 text-muted text-sm leading-relaxed">
        Your account moves to this address once you confirm. Every device will be signed out.
      </p>

      {actionData?.error && (
        <p
          role="alert"
          className="mb-4 rounded border border-down/40 bg-down/10 px-3 py-2 text-down text-sm"
        >
          {actionData.error}
        </p>
      )}

      <Form method="post">
        <button
          type="submit"
          disabled={busy || !loaderData.token}
          className="inline-flex h-10 w-full items-center justify-center rounded bg-accent-strong font-medium text-sm text-ink transition-colors hover:bg-accent-strong/85 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-60"
        >
          {busy ? "One moment" : "Confirm this address"}
        </button>
      </Form>
    </AuthShell>
  );
};

export default Email;
