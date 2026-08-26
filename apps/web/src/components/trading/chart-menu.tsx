import type { Side } from "@propsim/engine";
import { useEffect } from "react";
import { cn } from "~/lib/utils";
import { formatPrice } from "./format";
import { FOCUS_RING } from "./styles";

type Props = {
  price: number;
  x: number;
  y: number;
  onPick: (side: Side) => void;
  onClose: () => void;
};

const ITEM = cn(
  "flex h-8 w-full items-center justify-between gap-6 rounded px-2 text-sm transition-colors",
  FOCUS_RING,
);

const ChartMenu = ({ price, x, y, onPick, onClose }: Props) => {
  useEffect(() => {
    const leave = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    // Capture, or a click that lands on the menu closes it before it fires.
    window.addEventListener("keydown", leave);
    window.addEventListener("pointerdown", onClose);
    window.addEventListener("blur", onClose);

    return () => {
      window.removeEventListener("keydown", leave);
      window.removeEventListener("pointerdown", onClose);
      window.removeEventListener("blur", onClose);
    };
  }, [onClose]);

  return (
    <div
      // Its own pointerdown must not reach the listener that closes it.
      onPointerDown={(event) => event.stopPropagation()}
      style={{ left: x, top: y }}
      className="fixed z-50 w-40 rounded-lg border border-line bg-overlay p-1 shadow-[0_16px_40px_-24px_rgb(0_0_0)]"
    >
      <p className="px-2 py-1 text-[11px] text-faint uppercase tracking-wider tabular">
        {formatPrice(price)}
      </p>

      <button
        type="button"
        onClick={() => onPick("buy")}
        className={cn(ITEM, "text-up hover:bg-up/10")}
      >
        Buy
      </button>

      <button
        type="button"
        onClick={() => onPick("sell")}
        className={cn(ITEM, "text-down hover:bg-down/10")}
      >
        Sell
      </button>
    </div>
  );
};

export default ChartMenu;
