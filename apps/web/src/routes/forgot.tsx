import { sendResetPassword } from "@propsim/mail";
import { Form, href, Link, useNavigation } from "react-router";
import AuthShell, { BELOW_LINK } from "~/components/auth/auth-shell";
import { notify } from "~/lib/notify.server";
import { issueReset } from "~/lib/password-resets.server";
import { RESET_TTL_MINUTES } from "~/lib/policy";
import { PRIVATE } from "~/lib/seo";
import { findUserByEmail } from "~/lib/users.server";
import type { Route } from "./+types/forgot";

export const meta: Route.MetaFunction = () => [
  { title: "Reset your password, propsim.sh" },
  ...PRIVATE,
];

export const action = async ({ request }: Route.ActionArgs) => {
  const form = await request.formData();
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email) {
    return { error: "Enter your email address." };
  }

  const user = await findUserByEmail(email);

  if (user) {
    const token = await issueReset(user.id);

    if (token) {
      // Through notify, or a failed send answers differently for an address
      // that exists and turns this form into an account lookup.
      await notify(() =>
        sendResetPassword({ to: user.email, token, expiresInMinutes: RESET_TTL_MINUTES }),
      );
    }
  }

  // The same answer either way.
  return { sent: true };
};

const FIELD =
  "h-10 w-full rounded border border-line bg-sunken px-3 text-ink text-sm outline-hidden transition-colors focus-visible:border-accent focus-visible:ring-[0.5px] focus-visible:ring-accent";

const Forgot = ({ actionData }: Route.ComponentProps) => {
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  return (
    <AuthShell
      below={
        <Link to={href("/auth")} className={BELOW_LINK}>
          Back to log in
        </Link>
      }
    >
      <h1 className="font-semibold text-ink text-lg tracking-tight">Reset your password</h1>

      {actionData && "sent" in actionData ? (
        <p className="mt-2 text-muted text-sm leading-relaxed">
          If that address has an account, a link is on its way. It works once and expires in{" "}
          {RESET_TTL_MINUTES} minutes.
        </p>
      ) : (
        <>
          <p className="mt-1 mb-6 text-muted text-sm leading-relaxed">
            Give us the address on the account and we will send a link to set a new password.
          </p>

          <Form method="post" className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-muted text-xs">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
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
              {busy ? "One moment" : "Send the link"}
            </button>
          </Form>
        </>
      )}
    </AuthShell>
  );
};

export default Forgot;
