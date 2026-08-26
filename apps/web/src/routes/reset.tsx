import { sendPasswordChanged } from "@propsim/mail";
import { Form, href, Link, redirect, useNavigation } from "react-router";
import AuthShell from "~/components/auth/auth-shell";
import { notify } from "~/lib/notify.server";
import { hashPassword } from "~/lib/password.server";
import { consumeReset, resetIsLive } from "~/lib/password-resets.server";
import { MIN_PASSWORD } from "~/lib/policy";
import { PRIVATE } from "~/lib/seo";
import { revokeAllSessions } from "~/lib/sessions.server";
import { signIn } from "~/lib/sign-in.server";
import { findUserById, updatePassword } from "~/lib/users.server";
import type { Route } from "./+types/reset";

export const meta: Route.MetaFunction = () => [
  { title: "Choose a new password, propsim.sh" },
  ...PRIVATE,
];

const tokenOf = (request: Request) => new URL(request.url).searchParams.get("token") ?? "";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const token = tokenOf(request);

  return { live: Boolean(token) && (await resetIsLive(token)) };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const form = await request.formData();
  const password = String(form.get("password") ?? "");

  if (password.length < MIN_PASSWORD) {
    return { error: `Use at least ${MIN_PASSWORD} characters.` };
  }

  const userId = await consumeReset(tokenOf(request));

  if (!userId) {
    return { error: "That link has been used already or has expired." };
  }

  await updatePassword(userId, await hashPassword(password));

  // Every session, including any this browser holds: somebody else may know the
  // old password. The one opened below is the only one left.
  await revokeAllSessions(userId, "password_reset");

  const user = await findUserById(userId);

  if (!user) {
    return redirect(`${href("/auth")}?reset=1`);
  }

  await notify(() => sendPasswordChanged({ to: user.email }));

  // The link proved the address, so there is nothing left to ask for.
  return signIn(request, user, null);
};

const FIELD =
  "h-10 w-full rounded border border-line bg-sunken px-3 text-[16px] text-ink outline-hidden transition-colors focus-visible:border-accent focus-visible:ring-[0.5px] focus-visible:ring-accent sm:text-sm";

const Reset = ({ loaderData, actionData }: Route.ComponentProps) => {
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  if (!loaderData.live) {
    return (
      <AuthShell>
        <h1 className="font-semibold text-ink text-lg tracking-tight">
          That link is no longer good
        </h1>
        <p className="mt-2 text-muted text-sm leading-relaxed">
          A reset link works once and expires after an hour. Ask for another one.
        </p>
        <Link
          to={href("/forgot")}
          className="mt-6 inline-flex h-10 items-center rounded bg-accent-strong px-4 font-medium text-sm text-white transition-colors hover:bg-accent-strong/85 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
        >
          Send a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="font-semibold text-ink text-lg tracking-tight">Choose a new password</h1>
      <p className="mt-1 mb-6 text-muted text-sm leading-relaxed">
        Every device signed in to this account will be signed out.
      </p>

      <Form method="post" className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-muted text-xs">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD}
            required
            className={FIELD}
          />
        </div>

        {actionData?.error && (
          <p
            role="alert"
            className="rounded border border-down/40 bg-down/10 px-3 py-2 text-down text-sm"
          >
            {actionData.error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-10 w-full items-center justify-center rounded bg-accent-strong font-medium text-sm text-white transition-colors hover:bg-accent-strong/85 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-60"
        >
          {busy ? "One moment" : "Set the password"}
        </button>
      </Form>
    </AuthShell>
  );
};

export default Reset;
