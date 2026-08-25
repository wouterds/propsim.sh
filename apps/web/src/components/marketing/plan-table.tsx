import { href, Link } from "react-router";
import { formatDollars } from "~/lib/format";
import { PLANS } from "~/lib/plans";

const HEAD = "h-9 px-4 text-left font-normal text-[11px] text-faint uppercase tracking-wider";

const PlanTable = () => (
  <section className="border-line/70 border-b">
    <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <h2 className="font-semibold text-2xl text-ink tracking-tight">Pick a size</h2>
      <p className="mt-3 max-w-xl text-muted leading-relaxed">
        The same rule sets the funded firms sell, at no cost. A bigger balance buys more room in
        dollars and no more room in percent, which is the part most people get wrong.
      </p>

      <div className="mt-8 overflow-x-auto rounded-lg border border-line bg-raised">
        <table className="w-full min-w-[40rem] border-collapse">
          <thead>
            <tr className="border-line border-b">
              <th className={HEAD}>Plan</th>
              <th className={`${HEAD} text-right`}>Target</th>
              <th className={`${HEAD} text-right`}>Trailing drawdown</th>
              <th className={`${HEAD} text-right`}>Daily loss limit</th>
              <th className={`${HEAD} text-right`}>Position limit</th>
              <th className={HEAD}>
                <span className="sr-only">Get a free account</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {PLANS.map((plan) => (
              <tr key={plan.id} className="border-line/60 border-b last:border-b-0">
                <td className="h-14 px-4">
                  <span className="font-medium text-ink">{plan.label} Daily</span>
                  <span className="block text-[11px] text-faint tabular">
                    {formatDollars(plan.size)} to start
                  </span>
                </td>
                <td className="h-14 px-4 text-right text-ink text-sm tabular">
                  {formatDollars(plan.profitTarget)}
                </td>
                <td className="h-14 px-4 text-right text-ink text-sm tabular">
                  {formatDollars(plan.trailingDrawdown)}
                </td>
                <td className="h-14 px-4 text-right text-ink text-sm tabular">
                  {formatDollars(plan.dailyLossLimit)}
                </td>
                <td className="h-14 px-4 text-right text-muted text-sm tabular">
                  {plan.maxMinis} minis, {plan.maxMicros} micros
                </td>
                <td className="h-14 px-4 text-right">
                  <Link
                    to={`${href("/accounts/new")}?plan=${plan.id}`}
                    className="inline-flex h-8 items-center rounded border border-line px-3 text-sm text-muted transition-colors hover:border-line-strong hover:text-ink focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
                  >
                    Get free account
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </section>
);

export default PlanTable;
