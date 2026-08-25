import {
  formatPercent,
  formatPrice,
  formatSignedPoints,
  toneOf,
} from "~/components/trading/format";
import InstrumentPicker from "~/components/trading/instrument-picker";
import { cn } from "~/lib/utils";
import type { ChartBar } from "./candle-chart";

type Props = {
  symbol: string;
  onSymbolChange: (code: string) => void;
  period: string;
  first: ChartBar | undefined;
  last: ChartBar | undefined;
  hovered: ChartBar | null;
};

const Quote = ({ label, value }: { label: string; value: number }) => (
  <span className="flex gap-1">
    <span className="text-faint">{label}</span>
    <span className="tabular">{formatPrice(value)}</span>
  </span>
);

const ChartHeader = ({ symbol, onSymbolChange, period, first, last, hovered }: Props) => {
  const readout = hovered ?? last;
  const change = first && last ? last.close - first.open : 0;
  const percent = first && change ? (change / first.open) * 100 : 0;

  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-3 py-2">
      <InstrumentPicker value={symbol} onChange={onSymbolChange} />

      {last && (
        <>
          <span className="text-[15px] tabular">{formatPrice(last.close)}</span>
          <span className={cn("text-xs tabular", toneOf(change))}>
            {`${formatSignedPoints(change)} (${formatPercent(percent)})`}
          </span>
          {/* Named because each timeframe loads a different window, so the same
              price reads as up on one and down on another without it. */}
          <span className="text-[11px] text-faint">{`over ${period}`}</span>
        </>
      )}

      {readout && (
        <span className="hidden gap-3 text-[11px] text-muted sm:flex">
          <Quote label="O" value={readout.open} />
          <Quote label="H" value={readout.high} />
          <Quote label="L" value={readout.low} />
          <Quote label="C" value={readout.close} />
        </span>
      )}
    </div>
  );
};

export default ChartHeader;
