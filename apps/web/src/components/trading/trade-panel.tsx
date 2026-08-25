import { Select } from "@base-ui/react/select";
import { useState } from "react";
import { cn } from "~/lib/utils";
import Button from "./button";
import { formatPrice } from "./format";
import { TICK_SIZE } from "./mnq";
import NumberField from "./number-field";
import RiskReadout from "./risk-readout";
import SideToggle from "./side-toggle";
import { FIELD, FOCUS_RING, LABEL } from "./styles";
import { fillPriceFor, type OrderDraft, type OrderType, type Side } from "./trading-state";

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

type Props = { last: number | null; onSubmit: (draft: OrderDraft) => void };

const ORDER_TYPES = [
  { value: "market", label: "Market" },
  { value: "limit", label: "Limit" },
  { value: "stop", label: "Stop" },
];

const TradePanel = ({ last, onSubmit }: Props) => {
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  const patch = (fields: Partial<OrderDraft>) => setDraft((current) => ({ ...current, ...fields }));

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
          onChange={(quantity) => patch({ quantity: quantity ?? 1 })}
          step={1}
          min={1}
          disabled={stale}
          steppers
        />

        <Select.Root
          value={draft.type}
          onValueChange={(value) => patch({ type: value as OrderType })}
          disabled={stale}
        >
          <div className="flex flex-col gap-1">
            <Select.Label className={LABEL}>Order type</Select.Label>
            <Select.Trigger
              className={cn(FIELD, FOCUS_RING, "flex items-center justify-between text-left")}
            >
              <Select.Value />
              <Select.Icon className="text-faint">
                <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3">
                  <path
                    d="m4 6 4 4 4-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
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
                    className="cursor-default rounded px-2 py-1.5 text-ink text-sm data-[highlighted]:bg-accent data-[highlighted]:text-sunken"
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
        step={TICK_SIZE}
        placeholder={stale ? "–" : formatPrice(last)}
        disabled={stale || !resting}
      />

      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="Stop loss"
          value={draft.stopLoss}
          onChange={(stopLoss) => patch({ stopLoss })}
          step={TICK_SIZE}
          placeholder="–"
          disabled={stale}
        />
        <NumberField
          label="Take profit"
          value={draft.takeProfit}
          onChange={(takeProfit) => patch({ takeProfit })}
          step={TICK_SIZE}
          placeholder="–"
          disabled={stale}
        />
      </div>

      <div className="border-line border-t pt-3">
        <RiskReadout draft={draft} entry={entry} />
      </div>

      <Button
        type="submit"
        block
        variant={draft.side === "buy" ? "buy" : "sell"}
        disabled={stale || incomplete}
        className="h-9 uppercase tracking-wider"
      >
        {`${draft.side} ${draft.quantity} ${TYPE_LABELS[draft.type]} @ ${entryLabel}`}
      </Button>
    </form>
  );
};

export default TradePanel;
