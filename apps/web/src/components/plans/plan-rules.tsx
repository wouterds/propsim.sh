import { formatDollars } from "~/lib/format";
import type { Plan } from "~/lib/plans";

type Props = {
  plan: Plan;
  className?: string;
};

const rowsOf = (plan: Plan) => [
  { label: "Starting balance", value: formatDollars(plan.size) },
  { label: "Profit target", value: formatDollars(plan.profitTarget) },
  { label: "Trailing drawdown", value: formatDollars(plan.trailingDrawdown) },
  { label: "Daily loss limit", value: formatDollars(plan.dailyLossLimit) },
  { label: "Position limit", value: `${plan.maxMinis} minis, ${plan.maxMicros} micros` },
];

const PlanRules = ({ plan, className }: Props) => (
  <dl className={className}>
    {rowsOf(plan).map((row) => (
      <div
        key={row.label}
        className="flex items-baseline justify-between gap-3 border-line/60 border-b py-2 last:border-b-0"
      >
        <dt className="text-muted text-xs">{row.label}</dt>
        <dd className="text-ink text-xs tabular">{row.value}</dd>
      </div>
    ))}
  </dl>
);

export default PlanRules;
