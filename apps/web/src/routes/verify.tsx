import { OTPField } from "@base-ui/react/otp-field";
import { sendConfirmCode, sendWelcome } from "@propsim/mail";
import { useState } from "react";
import { Form, href, Link, redirect, useNavigation } from "react-router";
import Brand from "~/components/layout/brand";
import GridBackdrop from "~/components/layout/grid-backdrop";
import { getPendingUserId, startSession } from "~/lib/auth.server";
import { findUserById, markEmailVerified } from "~/lib/users.server";
import { CODE_DIGITS, CODE_TTL_MINUTES } from "~/lib/verification";
import { checkCode, issueCode } from "~/lib/verifications.server";
import type { Route } from "./+types/verify";

export const meta: Route.MetaFunction = () => [{ title: "Confirm your email, propsim.sh" }];

const SLOTS = Array.from({ length: CODE_DIGITS }, (_, index) => `digit-${index + 1}`);

const REFUSED: Record<string, string> = {
  wrong: "That code is not right.",
  expired: "That code has expired. Send a new one.",
  locked: "Too many tries. Send a new code.",
  missing: "That code has already been used. Send a new one.",
};

const pendingUser = async (request: Request) => {
  const pendingUserId = await getPendingUserId(request);
  const user = pendingUserId ? await findUserById(pendingUserId) : null;

  if (!user) {
    throw redirect(href("/auth"));
  }

  return user;
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await pendingUser(request);

  return { email: user.email };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const user = await pendingUser(request);
  const form = await request.formData();
  const back = new URL(request.url).searchParams.get("r");

  if (form.get("intent") === "resend") {
    const code = await issueCode(user.id);
    await sendConfirmCode({ to: user.email, code, expiresInMinutes: CODE_TTL_MINUTES });

    return { sent: true };
  }

  const code = String(form.get("code") ?? "").trim();
  const result = await checkCode(user.id, code);

  if (result !== "ok") {
    return { error: REFUSED[result] };
  }

  await markEmailVerified(user.id);
  await sendWelcome({ to: user.email });

  return startSession(user.id, back);
};

const Verify = ({ loaderData, actionData }: Route.ComponentProps) => {
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";
  const [code, setCode] = useState("");

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
          <h1 className="font-semibold text-ink text-lg tracking-tight">Confirm your email</h1>
          <p className="mt-1 mb-6 text-muted text-sm">
            We sent a six digit code to {loaderData.email}. It is good for {CODE_TTL_MINUTES}{" "}
            minutes.
          </p>

          <Form method="post" className="space-y-4">
            <OTPField.Root
              name="code"
              length={CODE_DIGITS}
              required
              autoComplete="one-time-code"
              value={code}
              onValueChange={setCode}
              aria-label="Confirmation code"
              className="flex justify-between gap-2"
            >
              {SLOTS.map((slot) => (
                <OTPField.Input
                  key={slot}
                  className="h-12 w-full rounded border border-line bg-sunken text-center text-ink text-lg tabular outline-hidden transition-colors focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
                />
              ))}
            </OTPField.Root>

            {actionData && "error" in actionData && actionData.error && (
              <p
                role="alert"
                className="rounded border border-down/40 bg-down/10 px-3 py-2 text-down text-sm"
              >
                {actionData.error}
              </p>
            )}

            {actionData && "sent" in actionData && (
              <p className="rounded border border-up/40 bg-up/10 px-3 py-2 text-sm text-up">
                A new code is on its way.
              </p>
            )}

            <button
              type="submit"
              disabled={busy || code.length < CODE_DIGITS}
              className="inline-flex h-10 w-full items-center justify-center rounded bg-accent font-medium text-sm text-sunken transition-colors hover:bg-accent/85 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-60"
            >
              {busy ? "One moment" : "Confirm"}
            </button>
          </Form>

          <Form method="post" className="mt-3">
            <input type="hidden" name="intent" value="resend" />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-sm text-center text-faint text-xs transition-colors hover:text-ink focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
            >
              Send a new code
            </button>
          </Form>
        </div>
      </div>
    </main>
  );
};

export default Verify;
