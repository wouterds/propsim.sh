import { sendConfirmCode } from "@propsim/mail";
import { useState } from "react";
import { href, Link } from "react-router";
import AuthForm from "~/components/auth/auth-form";
import { type AuthMode, COPY } from "~/components/auth/mode";
import ModeTabs from "~/components/auth/mode-tabs";
import Brand from "~/components/layout/brand";
import GridBackdrop from "~/components/layout/grid-backdrop";
import { startPending, startSession } from "~/lib/auth.server";
import { hashPassword, verifyPassword } from "~/lib/password.server";
import { createUser, findUserByEmail } from "~/lib/users.server";
import { CODE_TTL_MINUTES } from "~/lib/verification";
import { issueCode } from "~/lib/verifications.server";
import type { Route } from "./+types/auth";

export const meta: Route.MetaFunction = () => [{ title: "Log in, propsim.sh" }];

const MIN_PASSWORD = 8;

// The same answer whether the address is unknown or the password is wrong.
// Anything more specific tells an attacker which addresses are registered.
const REFUSED = "Email or password is incorrect.";

const sendCode = async (userId: string, email: string) => {
  const code = await issueCode(userId);

  await sendConfirmCode({ to: email, code, expiresInMinutes: CODE_TTL_MINUTES });
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

  if (!(await verifyPassword(password, user.password))) {
    return { error: REFUSED };
  }

  if (!user.verifiedEmailAt) {
    await sendCode(user.id, user.email);

    return startPending(user.id, back);
  }

  return startSession(request, user.id, back);
};

const Auth = ({ actionData }: Route.ComponentProps) => {
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
          <h1 className="mb-6 font-semibold text-ink text-lg tracking-tight">{COPY[mode].title}</h1>
          <AuthForm mode={mode} error={actionData?.error} />
        </div>
      </div>
    </main>
  );
};

export default Auth;
