import { Dialog } from "@base-ui/react/dialog";
import { PRIMARY_SM, SECONDARY_SM } from "~/components/ui/button";
import { formatPrice } from "./format";

export type OrderMove = {
  id: string;
  /** What it is, in the words the blotter uses. */
  label: string;
  quantity: number;
  from: number;
  to: number;
};

type Props = {
  move: OrderMove | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (move: OrderMove) => void;
};

/**
 * A drag is easy to start by accident on a chart that also pans, and the line
 * being dragged is what a position is closed at. It asks first.
 */
const MoveOrder = ({ move, busy, onCancel, onConfirm }: Props) => (
  <Dialog.Root
    open={move !== null}
    onOpenChange={(next) => {
      if (!next) onCancel();
    }}
  >
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-40 bg-sunken/70 backdrop-blur-sm" />
      <Dialog.Popup className="-translate-x-1/2 -translate-y-1/2 fixed top-1/2 left-1/2 z-50 w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-line bg-raised p-5 shadow-[0_24px_80px_-40px_rgb(0_0_0)] outline-hidden">
        <Dialog.Title className="font-semibold text-ink text-lg tracking-tight">
          Move this order
        </Dialog.Title>

        {move && (
          <>
            <Dialog.Description className="mt-2 text-muted text-sm capitalize">
              {`${move.label}, ${move.quantity} ${move.quantity === 1 ? "contract" : "contracts"}`}
            </Dialog.Description>

            <div className="mt-4 flex items-center justify-center gap-3 rounded border border-line bg-sunken px-4 py-3 tabular">
              <span className="text-faint text-sm line-through">{formatPrice(move.from)}</span>
              <span aria-hidden className="text-faint">
                →
              </span>
              <span className="font-semibold text-ink">{formatPrice(move.to)}</span>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Dialog.Close className={SECONDARY_SM}>Leave it</Dialog.Close>
              <button
                type="button"
                disabled={busy}
                onClick={() => onConfirm(move)}
                className={PRIMARY_SM}
              >
                {busy ? "One moment" : "Move it"}
              </button>
            </div>
          </>
        )}
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>
);

export default MoveOrder;
