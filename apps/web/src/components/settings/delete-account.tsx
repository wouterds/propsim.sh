import { Dialog } from "@base-ui/react/dialog";
import { useState } from "react";
import { Form } from "react-router";
import { DANGER, DANGER_SM, SECONDARY_SM } from "~/components/ui/button";

type Props = {
  email: string;
  busy: boolean;
};

const FIELD =
  "h-9 w-full rounded border border-line bg-sunken px-3 text-ink text-sm outline-hidden transition-colors placeholder:text-faint focus-visible:border-down focus-visible:ring-1 focus-visible:ring-down";

const DeleteAccount = ({ email, busy }: Props) => {
  const [typed, setTyped] = useState("");

  // The address is the confirmation. Nothing here asks for the password,
  // because somebody who is already signed in has passed that once.
  const matches = typed.trim().toLowerCase() === email.toLowerCase();

  return (
    <Dialog.Root onOpenChange={() => setTyped("")}>
      <Dialog.Trigger className={DANGER_SM}>Delete this account</Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-sunken/70 backdrop-blur-sm" />
        <Dialog.Popup className="-translate-x-1/2 -translate-y-1/2 fixed top-1/2 left-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-line bg-raised p-5 shadow-[0_24px_80px_-40px_rgb(0_0_0)] outline-hidden">
          <Dialog.Title className="font-semibold text-ink text-lg tracking-tight">
            Delete this account
          </Dialog.Title>

          <Dialog.Description className="mt-3 text-muted text-sm leading-relaxed">
            This cannot be undone. Every simulated account, every day in the journal and every
            device you are signed in on goes with it, and nothing here can bring any of it back.
          </Dialog.Description>

          <p className="mt-3 text-muted text-sm leading-relaxed">
            {`Type ${email} to confirm you are sure.`}
          </p>

          <Form method="post" className="mt-5">
            <input type="hidden" name="intent" value="delete" />

            <label htmlFor="confirm-email" className="sr-only">
              Your email address
            </label>
            <input
              id="confirm-email"
              name="email"
              type="email"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder={email}
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              className={FIELD}
            />

            <div className="mt-5 flex items-center justify-end gap-2">
              <Dialog.Close className={SECONDARY_SM}>Keep it</Dialog.Close>
              <button type="submit" disabled={!matches || busy} className={DANGER}>
                {busy ? "One moment" : "Delete it"}
              </button>
            </div>
          </Form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default DeleteAccount;
