import { cn } from "~/lib/utils";
import { formatMoney, formatSignedMoney, toneOf } from "./format";

type Props = {
  balance: number;
  equity: number | null;
  realised: number;
  openPnl: number | null;
  positions: number;
};

const Stat = ({ label, value, tone }: { label: string; value: string; tone?: string }) => (
  <div className="flex flex-col gap-0.5 whitespace-nowrap">
    <span className="text-[10px] text-faint uppercase tracking-wider">{label}</span>
    <span className={cn("text-sm tabular", tone ?? "text-ink")}>{value}</span>
  </div>
);

const AccountStrip = ({ balance, equity, realised, openPnl, positions }: Props) => (
  // One line, tight enough that every figure fits a phone. It scrolls rather
  // than wraps when a bigger balance stops that being true, because a second row
  // pushes the chart down the screen on every load.
  <div className="rounded-lg border border-line bg-raised">
    <div className="flex items-center gap-x-3 overflow-x-auto px-3 py-2 sm:gap-x-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Stat label="Balance" value={formatMoney(balance)} />
      <Stat
        label="Equity"
        value={equity === null ? "–" : formatMoney(equity)}
        tone={equity === null ? "text-faint" : undefined}
      />
      <Stat label="Realised" value={formatSignedMoney(realised)} tone={toneOf(realised)} />
      <Stat
        label="Open P&L"
        value={openPnl === null ? "–" : formatSignedMoney(openPnl)}
        tone={openPnl === null ? "text-faint" : toneOf(openPnl)}
      />
      <Stat label="Open" value={`${positions}`} />
    </div>
  </div>
);

export default AccountStrip;
