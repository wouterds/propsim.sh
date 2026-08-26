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
  // One line that scrolls rather than two that wrap. Five money figures do not
  // fit a phone at a size worth reading, and a second row pushed the chart down
  // the screen on every load.
  //
  // Every number here is a risk number, so the edge is faded rather than cut:
  // something half shown is something a trader knows to reach for.
  <div className="relative rounded-lg border border-line bg-raised">
    <div className="flex items-center gap-x-6 overflow-x-auto px-3 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-px right-px w-8 rounded-r-lg bg-gradient-to-l from-raised to-transparent sm:hidden"
    />
  </div>
);

export default AccountStrip;
