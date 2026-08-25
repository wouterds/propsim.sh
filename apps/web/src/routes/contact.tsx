import { Turnstile } from "@marsidev/react-turnstile";
import { sendContactMessage } from "@propsim/mail";
import { Form, useNavigation } from "react-router";
import { getUserId } from "~/lib/auth.server";
import { notify } from "~/lib/notify.server";
import { pageMeta } from "~/lib/seo";
import { FIELD, passedTurnstile, siteKey, turnstileIsSet } from "~/lib/turnstile.server";
import { findUserById } from "~/lib/users.server";
import type { Route } from "./+types/contact";

export const meta: Route.MetaFunction = () =>
  pageMeta({
    title: "Contact, propsim.sh",
    description:
      "Ask a question about propsim.sh, report something broken, or say the rules are wrong.",
    path: "/contact",
  });

const LIMITS = { name: 80, subject: 120, message: 4000 };

const CONTACT_TO = "hello@propsim.sh";

const addressOf = async (request: Request) => {
  const userId = await getUserId(request);

  return userId ? ((await findUserById(userId))?.email ?? null) : null;
};

export const loader = async ({ request }: Route.LoaderArgs) => ({
  siteKey: siteKey(),
  guarded: turnstileIsSet(),
  email: await addressOf(request),
});

export const action = async ({ request }: Route.ActionArgs) => {
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  // Signed in, the account's address is the one that answers. The field is read
  // only in the browser and read only here too.
  const email =
    (await addressOf(request)) ??
    String(form.get("email") ?? "")
      .trim()
      .toLowerCase();
  const subject = String(form.get("subject") ?? "").trim();
  const message = String(form.get("message") ?? "").trim();

  if (!name || !email || !subject || !message) {
    return { sent: false, error: "Every field is needed." };
  }

  if (
    name.length > LIMITS.name ||
    subject.length > LIMITS.subject ||
    message.length > LIMITS.message
  ) {
    return { sent: false, error: "That is longer than the form takes." };
  }

  if (turnstileIsSet() && !(await passedTurnstile(request, String(form.get(FIELD) ?? "")))) {
    return { sent: false, error: "That did not get past the check. Try again." };
  }

  // Through notify, so a provider outage does not throw the message away in
  // front of somebody who has already typed it.
  await notify(() => sendContactMessage({ to: CONTACT_TO, name, email, subject, message }));

  return { sent: true, error: null };
};

const LABEL = "mb-1.5 block text-[11px] text-faint uppercase tracking-wider";

const CONTROL =
  "w-full rounded border border-line bg-sunken px-3 text-ink text-sm outline-hidden transition-colors placeholder:text-faint focus-visible:border-accent focus-visible:ring-[0.5px] focus-visible:ring-accent";

const Contact = ({ loaderData, actionData }: Route.ComponentProps) => {
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  return (
    <section className="border-line/70 border-b">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <h1 className="font-semibold text-4xl text-ink leading-[1.1] tracking-tight">Contact</h1>
        <p className="mt-6 max-w-2xl text-muted leading-relaxed">
          A question, something broken, or a rule written down wrong. It reaches a person, and the
          reply comes from one.
        </p>

        {actionData?.sent ? (
          <p className="mt-10 max-w-xl rounded-lg border border-up/40 bg-up/10 px-4 py-3 text-sm text-up">
            That is on its way. You will get a reply at the address you gave.
          </p>
        ) : (
          <Form method="post" className="mt-10 max-w-xl space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className={LABEL}>
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  maxLength={LIMITS.name}
                  required
                  autoComplete="name"
                  className={`h-10 ${CONTROL}`}
                />
              </div>

              <div>
                <label htmlFor="email" className={LABEL}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  defaultValue={loaderData.email ?? undefined}
                  readOnly={loaderData.email !== null}
                  className={`h-10 ${CONTROL} read-only:cursor-default read-only:text-muted`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className={LABEL}>
                Subject
              </label>
              <input
                id="subject"
                name="subject"
                maxLength={LIMITS.subject}
                required
                className={`h-10 ${CONTROL}`}
              />
            </div>

            <div>
              <label htmlFor="message" className={LABEL}>
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={7}
                maxLength={LIMITS.message}
                required
                className={`resize-y py-2.5 ${CONTROL}`}
              />
            </div>

            {loaderData.siteKey && (
              <Turnstile
                siteKey={loaderData.siteKey}
                options={{ action: "turnstile-spin-v2", theme: "dark" }}
              />
            )}

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
              className="inline-flex h-10 items-center rounded bg-accent-strong px-5 font-medium text-sm text-ink transition-colors hover:bg-accent-strong/85 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-60"
            >
              {busy ? "Sending" : "Send"}
            </button>
          </Form>
        )}
      </div>
    </section>
  );
};

export default Contact;
