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
  <div className="flex shrink-0 snap-start flex-col gap-0.5 pr-6">
    <span className="text-[10px] text-faint uppercase tracking-wider">{label}</span>
    <span className={cn("text-sm tabular", tone ?? "text-ink")}>{value}</span>
  </div>
);

const AccountStrip = ({ balance, equity, realised, openPnl, positions }: Props) => (
  <div className="flex snap-x items-center overflow-x-auto rounded-lg border border-line bg-raised px-3 py-2">
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
);

export default AccountStrip;
