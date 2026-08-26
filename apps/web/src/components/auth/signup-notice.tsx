import { Checkbox } from "@base-ui/react/checkbox";
import { Dialog } from "@base-ui/react/dialog";
import { Check } from "lucide-react";
import { useRef, useState } from "react";
import { PRIMARY_SM, SECONDARY_SM } from "~/components/ui/button";

/**
 * Holds whichever way somebody started signing up until they have said they
 * understand there is no money here. Both ways run through one notice, so
 * neither can be the one that skips it.
 *
 * `gate` answers whether the caller may go ahead now. `false` means the notice
 * is open and the action is being held, and the caller has to stop what it was
 * doing. Answering rather than calling back is what stops the released action
 * re-entering the gate and holding itself again.
 */
export const useSignupNotice = (signingUp: boolean) => {
  const held = useRef<(() => void) | null>(null);
  const read = useRef(false);
  const [open, setOpen] = useState(false);

  const gate = (go: () => void) => {
    if (!signingUp || read.current) {
      return true;
    }

    held.current = go;
    setOpen(true);

    return false;
  };

  const confirm = () => {
    read.current = true;
    setOpen(false);
    held.current?.();
  };

  return { open, setOpen, gate, confirm };
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

const POINTS = [
  "None of the money on this platform is real.",
  "There are no payouts. There is nothing to withdraw, ever.",
  "There is no funded account at the end of it, and nothing to buy.",
];

const SignupNotice = ({ open, onOpenChange, onConfirm }: Props) => {
  const [read, setRead] = useState(false);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        // Backing out and starting again asks again, or the box stays ticked
        // from a decision somebody has already walked away from once.
        if (!next) setRead(false);
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-sunken/70 backdrop-blur-sm" />
        <Dialog.Popup className="-translate-x-1/2 -translate-y-1/2 fixed top-1/2 left-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-line bg-raised p-5 shadow-[0_24px_80px_-40px_rgb(0_0_0)] outline-hidden">
          <Dialog.Title className="font-semibold text-ink text-lg tracking-tight">
            Before you sign up
          </Dialog.Title>

          <Dialog.Description className="mt-3 text-muted text-sm leading-relaxed">
            propsim.sh is a simulator. It puts a prop firm's rules on a practice account so you can
            find out whether you can hold to them, and that is all it does.
          </Dialog.Description>

          <ul className="mt-4 space-y-2">
            {POINTS.map((point) => (
              <li key={point} className="flex gap-2.5 text-ink text-sm leading-relaxed">
                <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-warn" />
                {point}
              </li>
            ))}
          </ul>

          <label
            htmlFor="signup-notice-read"
            className="mt-5 flex cursor-pointer items-start gap-2.5 rounded border border-line bg-sunken p-3 text-ink text-sm leading-relaxed"
          >
            <Checkbox.Root
              id="signup-notice-read"
              checked={read}
              onCheckedChange={setRead}
              className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border border-line-strong bg-base outline-hidden focus-visible:ring-1 focus-visible:ring-accent data-[checked]:border-accent-strong data-[checked]:bg-accent-strong"
            >
              <Checkbox.Indicator>
                <Check aria-hidden className="size-3 text-ink" strokeWidth={3} />
              </Checkbox.Indicator>
            </Checkbox.Root>
            I have read this and understand that I cannot earn or withdraw money here.
          </label>

          <div className="mt-5 flex items-center justify-end gap-2">
            <Dialog.Close className={SECONDARY_SM}>Back</Dialog.Close>
            <button type="button" disabled={!read} onClick={onConfirm} className={PRIMARY_SM}>
              Create my account
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default SignupNotice;
