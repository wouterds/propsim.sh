import { cn } from "~/lib/utils";
import { FOCUS_RING } from "./styles";
import type { Side } from "./trading-state";

const ACTIVE: Record<Side, string> = {
  buy: "bg-up text-sunken",
  sell: "bg-down text-sunken",
};

const SideToggle = ({ value, onChange }: { value: Side; onChange: (side: Side) => void }) => (
  <div className="grid grid-cols-2 gap-1">
    {(["buy", "sell"] as const).map((side) => (
      <button
        key={side}
        type="button"
        aria-pressed={value === side}
        onClick={() => onChange(side)}
        className={cn(
          "h-9 rounded font-semibold text-xs uppercase tracking-wider transition-colors",
          value === side ? ACTIVE[side] : "border border-line text-muted hover:text-ink",
          FOCUS_RING,
        )}
      >
        {side}
      </button>
    ))}
  </div>
);

export default SideToggle;
