import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { cn } from "~/lib/utils";
import { FOCUS_RING } from "./styles";
import type { Side } from "./trading-state";

const ACTIVE: Record<Side, string> = {
  buy: "data-[pressed]:bg-up data-[pressed]:text-sunken",
  sell: "data-[pressed]:bg-down data-[pressed]:text-sunken",
};

const SideToggle = ({ value, onChange }: { value: Side; onChange: (side: Side) => void }) => (
  <ToggleGroup
    value={[value]}
    onValueChange={(next) => {
      const [side] = next;

      if (side) {
        onChange(side as Side);
      }
    }}
    aria-label="Order side"
    className="grid grid-cols-2 gap-1"
  >
    {(["buy", "sell"] as const).map((side) => (
      <Toggle
        key={side}
        value={side}
        className={cn(
          "h-9 rounded border border-line font-semibold text-muted text-xs uppercase tracking-wider transition-colors hover:text-ink",
          "data-[pressed]:border-transparent",
          ACTIVE[side],
          FOCUS_RING,
        )}
      >
        {side}
      </Toggle>
    ))}
  </ToggleGroup>
);

export default SideToggle;
