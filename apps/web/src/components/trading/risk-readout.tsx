import { formatMoney } from "./format";
import { notionalOf, type OrderDraft, rewardOf, riskOf, rrRatio } from "./trading-state";

// An unset value takes the faint dash rather than the tone: red and green are
// reserved for a loss and a profit, and "not set" is neither.
const Row = ({ label, value, tone }: { label: string; value: string | null; tone?: string }) => (
  <div className="flex items-baseline justify-between">
    <span className="text-[11px] text-faint uppercase tracking-wider">{label}</span>
    <span className={value === null ? "text-faint" : (tone ?? "text-ink")}>{value ?? "—"}</span>
  </div>
);

const RiskReadout = ({ draft, entry }: { draft: OrderDraft; entry: number | null }) => {
  const risk = riskOf(draft, entry);
  const reward = rewardOf(draft, entry);
  const ratio = rrRatio(risk, reward);
  const notional = notionalOf(draft.quantity, entry);

  return (
    <div className="flex flex-col gap-1.5 text-xs tabular">
      <Row label="Risk" value={risk === null ? null : formatMoney(risk)} tone="text-down" />
      <Row label="Reward" value={reward === null ? null : formatMoney(reward)} tone="text-up" />
      <Row label="R : R" value={ratio === null ? null : `${ratio.toFixed(2)} : 1`} />
      <Row label="Notional" value={notional === null ? null : formatMoney(notional)} />
    </div>
  );
};

export default RiskReadout;
