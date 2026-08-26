import { Select } from "@base-ui/react/select";
import type { Side } from "@propsim/engine";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { recall, remember } from "~/lib/remember";
import { cn } from "~/lib/utils";
import Button from "./button";
import { formatPrice } from "./format";
import NumberField from "./number-field";
import RiskReadout from "./risk-readout";
import SideToggle from "./side-toggle";
import { FIELD, LABEL } from "./styles";
import { fillPriceFor, type OrderDraft, type OrderType } from "./trading-state";

const EMPTY_DRAFT: OrderDraft = {
  side: "buy",
  quantity: 1,
  type: "market",
  limitPrice: null,
  stopLoss: null,
  takeProfit: null,
};

const TYPE_LABELS: Record<OrderType, string> = {
  market: "MKT",
  limit: "LMT",
  stop: "STP",
};

/** A price taken off the chart. A new object each time, so picking twice re-applies. */
export type TicketPick = { side: Side; type: OrderType; price: number };

type Props = {
  last: number | null;
  tick: number;
  point: number;
  pick: TicketPick | null;
  onSubmit: (draft: OrderDraft) => void;
};

const ORDER_TYPES = [
  { value: "market", label: "Market" },
  { value: "limit", label: "Limit" },
  { value: "stop", label: "Stop" },
];

const KEY = "terminal.ticket";

const SIDES: Side[] = ["buy", "sell"];
const TYPES: OrderType[] = ["market", "limit", "stop"];

type Kept = { side: Side; type: OrderType; quantity: number };

/** Prices are quoted against a tape that has moved on, so only the shape is kept. */
const keptFrom = (raw: string | null): Kept | null => {
  try {
    const held = JSON.parse(raw ?? "") as Partial<Kept>;

    if (!SIDES.includes(held.side as Side) || !TYPES.includes(held.type as OrderType)) {
      return null;
    }

    const quantity = Math.floor(Number(held.quantity));

    return {
      side: held.side as Side,
      type: held.type as OrderType,
      quantity: Number.isFinite(quantity) && quantity > 0 ? Math.min(quantity, 100) : 1,
    };
  } catch {
    return null;
  }
};

const TradePanel = ({ last, tick, point, pick, onSubmit }: Props) => {
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const quantity = useRef<HTMLInputElement>(null);

  // Taken after the first paint, so the server and the browser start the same.
  useEffect(() => {
    const kept = keptFrom(recall(KEY));

    if (kept) {
      setDraft((current) => ({ ...current, ...kept }));
    }
  }, []);

  // Everything but the size, which is what the trader still has to say.
  useEffect(() => {
    if (!pick) {
      return;
    }

    setDraft((current) => {
      const next = { ...current, side: pick.side, type: pick.type, limitPrice: pick.price };

      remember(KEY, JSON.stringify({ side: next.side, type: next.type, quantity: next.quantity }));

      return next;
    });

    quantity.current?.focus();
    quantity.current?.select();
  }, [pick]);

  const patch = (fields: Partial<OrderDraft>) => {
    setDraft((current) => {
      const next = { ...current, ...fields };

      remember(KEY, JSON.stringify({ side: next.side, type: next.type, quantity: next.quantity }));

      return next;
    });
  };

  // No tape, no ticket. Every price on this form is quoted against the last
  // print, so a stand-in would put a number on the button that nothing backs.
  const stale = last === null;
  const resting = draft.type !== "market";
  const entry = stale ? null : fillPriceFor(draft, last);
  const incomplete = draft.quantity < 1 || (resting && draft.limitPrice === null);
  const entryLabel = entry === null ? "–" : formatPrice(entry);

  const place = () => {
    if (incomplete) return;

    onSubmit(draft);
  };

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        place();
      }}
    >
      <SideToggle value={draft.side} onChange={(side: Side) => patch({ side })} />

      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="Quantity"
          value={draft.quantity}
          onChange={(value) => patch({ quantity: value ?? 1 })}
          step={1}
          min={1}
          disabled={stale}
          steppers
          inputRef={quantity}
        />

        <Select.Root
          value={draft.type}
          onValueChange={(value) => patch({ type: value as OrderType })}
          disabled={stale}
        >
          <div className="flex flex-col gap-1">
            <Select.Label className={LABEL}>Order type</Select.Label>
            <Select.Trigger className={cn(FIELD, "flex items-center justify-between text-left")}>
              <Select.Value />
              <Select.Icon className="text-faint">
                <ChevronDown aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
              </Select.Icon>
            </Select.Trigger>
          </div>
          <Select.Portal>
            <Select.Positioner sideOffset={4}>
              <Select.Popup className="min-w-[var(--anchor-width)] rounded border border-line bg-overlay p-1 shadow-[0_16px_40px_-24px_rgb(0_0_0)]">
                {ORDER_TYPES.map((type) => (
                  <Select.Item
                    key={type.value}
                    value={type.value}
                    className="cursor-default rounded px-2 py-1.5 text-ink text-sm data-[highlighted]:bg-accent data-[highlighted]:text-white"
                  >
                    <Select.ItemText>{type.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </div>

      <NumberField
        label={resting ? "Trigger price" : "Trigger price (market)"}
        value={resting ? draft.limitPrice : null}
        onChange={(limitPrice) => patch({ limitPrice })}
        step={tick}
        placeholder={stale ? "–" : formatPrice(last)}
        disabled={stale || !resting}
      />

      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="Stop loss"
          value={draft.stopLoss}
          onChange={(stopLoss) => patch({ stopLoss })}
          step={tick}
          placeholder="–"
          disabled={stale}
        />
        <NumberField
          label="Take profit"
          value={draft.takeProfit}
          onChange={(takeProfit) => patch({ takeProfit })}
          step={tick}
          placeholder="–"
          disabled={stale}
        />
      </div>

      <div className="border-line border-t pt-3">
        <RiskReadout point={point} draft={draft} entry={entry} />
      </div>

      <Button
        type="submit"
        block
        variant={draft.side === "buy" ? "buy" : "sell"}
        disabled={stale || incomplete}
        className="h-9 text-sm capitalize"
      >
        {`${draft.side} ${draft.quantity} ${TYPE_LABELS[draft.type]} @ ${entryLabel}`}
      </Button>
    </form>
  );
};

export default TradePanel;
