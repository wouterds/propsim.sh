import { Dialog } from "@base-ui/react/dialog";
import { Form, href, redirect, useNavigate, useNavigation } from "react-router";
import { PRIMARY_SM, SECONDARY_SM } from "~/components/ui/button";
import { requireUserId } from "~/lib/auth.server";
import { featurePath } from "~/lib/board";
import { createFeature } from "~/lib/board.server";
import type { Route } from "./+types/feature-new";

const LIMITS = { title: 120, description: 4000 };

// Guarded on the way in as well as on the way out, so the form is never drawn
// for somebody who cannot post it.
export const loader = async ({ request }: Route.LoaderArgs) => {
  await requireUserId(request);

  return null;
};

export const action = async ({ request }: Route.ActionArgs) => {
  const userId = await requireUserId(request);
  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();

  if (!title || !description) {
    return { error: "A title and a description are both needed." };
  }

  if (title.length > LIMITS.title || description.length > LIMITS.description) {
    return { error: "That is longer than the form takes." };
  }

  return redirect(featurePath(await createFeature(userId, title, description), title));
};

const LABEL = "mb-1.5 block text-[11px] text-faint uppercase tracking-wider";

const CONTROL =
  "w-full rounded-lg border border-line bg-sunken px-3 text-ink text-sm outline-hidden transition-colors placeholder:text-faint focus-visible:border-accent focus-visible:ring-[0.5px] focus-visible:ring-accent";

const NewFeature = ({ actionData }: Route.ComponentProps) => {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) {
          navigate(href("/feature-requests"));
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-sunken/60 backdrop-blur-md transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />

        <Dialog.Popup className="-translate-x-1/2 -translate-y-1/2 fixed top-1/2 left-1/2 z-50 w-[min(34rem,calc(100vw-2rem))] rounded-2xl border border-line bg-raised p-6 shadow-[0_24px_80px_-40px_rgb(0_0_0)] outline-hidden transition-all duration-200 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0">
          <Dialog.Title className="font-semibold text-ink text-lg tracking-tight">
            Add a request
          </Dialog.Title>

          <Dialog.Description className="mt-2 text-muted text-sm leading-relaxed">
            One thing per request. The title is what people vote on, so keep it to the thing itself.
          </Dialog.Description>

          <Form method="post" className="mt-6">
            <div>
              <label htmlFor="title" className={LABEL}>
                Title
              </label>
              <input
                id="title"
                name="title"
                maxLength={LIMITS.title}
                required
                autoComplete="off"
                placeholder="Trail the floor behind a winning day"
                className={`h-10 ${CONTROL}`}
              />
            </div>

            <div className="mt-4">
              <label htmlFor="description" className={LABEL}>
                What it should do
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                maxLength={LIMITS.description}
                required
                placeholder="What you are trying to do today, and where the simulator stops you."
                className={`resize-y py-2.5 ${CONTROL}`}
              />
            </div>

            {actionData?.error && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-down/40 bg-down/10 px-3 py-2 text-down text-sm"
              >
                {actionData.error}
              </p>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <Dialog.Close className={SECONDARY_SM}>Cancel</Dialog.Close>
              <button type="submit" disabled={busy} className={PRIMARY_SM}>
                {busy ? "Posting" : "Post it"}
              </button>
            </div>
          </Form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default NewFeature;
