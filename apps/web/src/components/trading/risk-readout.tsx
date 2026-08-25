import { formatMoney, formatRatio } from "./format";
import { notionalOf, type OrderDraft, rewardOf, riskOf, rrRatio } from "./trading-state";

const Row = ({ label, value, tone }: { label: string; value: string | null; tone?: string }) => (
  <div className="flex items-baseline justify-between">
    <span className="text-[11px] text-faint uppercase tracking-wider">{label}</span>
    <span className={value === null ? "text-faint" : (tone ?? "text-ink")}>{value ?? "–"}</span>
  </div>
);

const RiskReadout = ({
  draft,
  entry,
  point,
}: {
  draft: OrderDraft;
  entry: number | null;
  point: number;
}) => {
  const risk = riskOf(draft, entry, point);
  const reward = rewardOf(draft, entry, point);
  const ratio = rrRatio(risk, reward);
  const notional = notionalOf(draft.quantity, entry, point);

  return (
    <div className="flex flex-col gap-1.5 text-xs tabular">
      <Row label="Risk" value={risk === null ? null : formatMoney(risk)} tone="text-down" />
      <Row label="Reward" value={reward === null ? null : formatMoney(reward)} tone="text-up" />
      <Row label="R : R" value={ratio === null ? null : `${formatRatio(ratio)} : 1`} />
      <Row label="Notional" value={notional === null ? null : formatMoney(notional)} />
    </div>
  );
};

export default RiskReadout;
