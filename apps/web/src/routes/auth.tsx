import { sendConfirmCode } from "@propsim/mail";
import { useState } from "react";
import { href, Link, redirect } from "react-router";
import AuthForm from "~/components/auth/auth-form";
import GoogleButton from "~/components/auth/google-button";
import { type AuthMode, COPY } from "~/components/auth/mode";
import ModeTabs from "~/components/auth/mode-tabs";
import Brand from "~/components/layout/brand";
import GridBackdrop from "~/components/layout/grid-backdrop";
import { getUserId, startPending } from "~/lib/auth.server";
import { googleIsSet } from "~/lib/google.server";
import { notify } from "~/lib/notify.server";
import { hashPassword, verifyPassword } from "~/lib/password.server";
import { CODE_TTL_MINUTES, MIN_PASSWORD } from "~/lib/policy";
import { safeReturn } from "~/lib/redirect.server";
import { PRIVATE } from "~/lib/seo";
import { signIn } from "~/lib/sign-in.server";
import { createUser, findUserByEmail } from "~/lib/users.server";
import { cn } from "~/lib/utils";
import { issueCode } from "~/lib/verifications.server";
import type { Route } from "./+types/auth";

export const meta: Route.MetaFunction = () => [{ title: "Log in, propsim.sh" }, ...PRIVATE];

const REFUSED_GOOGLE: Record<string, string> = {
  cancelled: "That was cancelled before Google could answer.",
  state: "That sign in did not come back the way it left. Start it again.",
  failed: "Google could not be reached. Try again in a moment.",
  unverified: "Google has not confirmed that address, so it cannot open an account here.",
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const params = new URL(request.url).searchParams;
  const back = params.get("r");

  // Already signed in, so there is nothing to do here. Reaching this page in
  // that state is how a device collects a second session for itself.
  if (await getUserId(request)) {
    throw redirect(safeReturn(back));
  }

  return {
    reset: params.has("reset"),
    google: REFUSED_GOOGLE[params.get("google") ?? ""] ?? null,
    start: back ? `/auth/google?r=${encodeURIComponent(back)}` : "/auth/google",
    withGoogle: googleIsSet(),
  };
};

// The same answer whether the address is unknown or the password is wrong.
// Anything more specific tells an attacker which addresses are registered.
const REFUSED = "Email or password is incorrect.";

// Through notify: the row is already written by the time this runs, so a
// provider outage would otherwise 500 an account into existence that its owner
// can neither verify nor sign up for again. They land on the code page and the
// resend button is what recovers it.
const sendCode = async (userId: string, email: string) => {
  const code = await issueCode(userId);

  await notify(() => sendConfirmCode({ to: email, code, expiresInMinutes: CODE_TTL_MINUTES }));
};

export const action = async ({ request }: Route.ActionArgs) => {
  const form = await request.formData();
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(form.get("password") ?? "");
  const back = new URL(request.url).searchParams.get("r");

  if (!email || !password) {
    return { error: "Email and password are both required." };
  }

  if (form.get("mode") === "signup") {
    if (password.length < MIN_PASSWORD) {
      return { error: `Use at least ${MIN_PASSWORD} characters.` };
    }

    if (password !== String(form.get("confirm") ?? "")) {
      return { error: "The two passwords do not match." };
    }

    if (await findUserByEmail(email)) {
      return { error: "That email already has an account." };
    }

    const userId = await createUser(email, await hashPassword(password));
    await sendCode(userId, email);

    return startPending(userId, back);
  }

  const user = await findUserByEmail(email);

  if (!user) {
    // Hashed anyway, or the reply comes back fast enough to say the address is
    // unknown without saying it.
    await hashPassword(password);

    return { error: REFUSED };
  }

  // Google only, so there is nothing to check against. Hashed anyway, or the
  // reply says which accounts have a password on them.
  if (!user.password) {
    await hashPassword(password);

    return { error: REFUSED };
  }

  if (!(await verifyPassword(password, user.password))) {
    return { error: REFUSED };
  }

  if (!user.verifiedEmailAt) {
    await sendCode(user.id, user.email);

    return startPending(user.id, back);
  }

  return signIn(request, user, back);
};

const Auth = ({ loaderData, actionData }: Route.ComponentProps) => {
  const [mode, setMode] = useState<AuthMode>("login");

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-16">
      <GridBackdrop />

      <div className="relative w-full max-w-sm">
        <Link
          to={href("/")}
          className="mx-auto flex w-fit rounded-sm focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
        >
          <Brand className="text-[1rem] text-ink" />
        </Link>

        <div className="mt-8 rounded-xl border border-line bg-raised p-6 shadow-[0_24px_80px_-40px_rgb(0_0_0)]">
          <ModeTabs mode={mode} onChange={setMode} />
          <h1 className="mb-4 font-semibold text-ink text-lg tracking-tight">{COPY[mode].title}</h1>
          {loaderData.google && (
            <p
              role="alert"
              className="mb-4 rounded border border-down/40 bg-down/10 px-3 py-2 text-down text-sm"
            >
              {loaderData.google}
            </p>
          )}

          {loaderData.reset && (
            <p className="mb-4 rounded border border-up/40 bg-up/10 px-3 py-2 text-sm text-up">
              Your password was changed. Log in with the new one.
            </p>
          )}

          <AuthForm key={mode} mode={mode} error={actionData?.error} />

          {loaderData.withGoogle && (
            <>
              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-line" />
                <span className="text-[11px] text-faint uppercase tracking-wider">or</span>
                <span className="h-px flex-1 bg-line" />
              </div>

              <GoogleButton to={loaderData.start} />
            </>
          )}
        </div>

        {/* Always here, so the card does not change height when the tab does.
            Signing up just fades it out and takes it out of reach. */}
        <Link
          to={href("/forgot")}
          aria-hidden={mode !== "login"}
          tabIndex={mode === "login" ? undefined : -1}
          className={cn(
            "mt-4 block rounded-sm text-center text-faint text-xs transition duration-150 hover:text-ink focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent",
            mode === "login" ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          Forgot your password?
        </Link>
      </div>
    </main>
  );
};

export default Auth;
