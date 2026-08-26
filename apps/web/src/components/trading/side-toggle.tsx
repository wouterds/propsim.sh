import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import type { Side } from "@propsim/engine";
import { cn } from "~/lib/utils";
import { FOCUS_RING } from "./styles";

const FILL: Record<Side, string> = {
  buy: "data-[pressed]:bg-up",
  sell: "data-[pressed]:bg-down",
};

// The hover on the unpressed button sets `ink`, which would otherwise win here
// and put a near-white label on teal at 2.1:1.
const PRESSED =
  "data-[pressed]:border-transparent data-[pressed]:text-sunken data-[pressed]:hover:text-sunken";

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
          "h-9 rounded border border-line font-semibold text-muted text-sm capitalize transition-colors hover:text-ink",
          FILL[side],
          PRESSED,
          FOCUS_RING,
        )}
      >
        {side}
      </Toggle>
    ))}
  </ToggleGroup>
);

export default SideToggle;
