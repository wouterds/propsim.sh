import { PLANS, trailStopsAt } from "@propsim/plans";
import { href, Link } from "react-router";
import PlanRules from "~/components/plans/plan-rules";
import { formatDollars } from "~/lib/format";
import { pageMeta } from "~/lib/seo";
import type { Route } from "./+types/plans";

export const meta: Route.MetaFunction = () =>
  pageMeta({
    title: "Account plans, propsim.sh",
    description:
      "Four simulated futures accounts, from 25K to 150K, carrying Lucid Trading's LucidDaily rules number for number: the profit target, the trailing drawdown and the daily loss limit. All free.",
    path: "/plans",
  });

const Plans = () => (
  <>
    <section className="border-line/70 border-b">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <h1 className="font-semibold text-4xl text-ink leading-[1.1] tracking-tight">
          Account plans
        </h1>
        <p className="mt-6 max-w-2xl text-muted leading-relaxed">
          Every plan is a copy of Lucid Trading&apos;s LucidDaily account, the one with the daily
          loss limit on and an intraday drawdown, taken from their published terms in August 2026
          number for number: the profit target, the trailing drawdown, the daily loss limit, the
          position cap, the commissions and the news rule. They differ in the balance you start with
          and in how many contracts you can hold. None of them costs anything.
        </p>
        <p className="mt-4 max-w-2xl text-faint text-sm leading-relaxed">
          LucidDaily is Lucid Trading&apos;s product and name. propsim.sh is not Lucid Trading, is
          not affiliated with them, and passing here means nothing to them. It is the same rulebook
          for free, so you can find out how you do under it before you pay for it.
        </p>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => (
            <div key={plan.id} className="flex flex-col rounded-lg border border-line bg-raised">
              <div className="border-line/70 border-b px-4 py-4">
                <p className="font-semibold text-ink text-lg tracking-tight">
                  {plan.label} LucidDaily
                </p>
                <p className="mt-3 font-semibold text-2xl text-up">Free</p>
              </div>

              <div className="px-4 py-3">
                <PlanRules plan={plan} />
              </div>

              <div className="mt-auto border-line/70 border-t px-4 py-3">
                <Link
                  to={`${href("/accounts/new")}?plan=${plan.id}`}
                  className="inline-flex h-9 w-full items-center justify-center rounded bg-accent-strong font-medium text-sm text-white transition-colors hover:bg-accent-strong/85 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
                >
                  Get free account
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="border-line/70 border-b">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <h2 className="font-semibold text-2xl text-ink tracking-tight">What the numbers mean</h2>

        <dl className="mt-10 grid gap-8 sm:grid-cols-2">
          <div>
            <dt className="font-medium text-ink">Profit target</dt>
            <dd className="mt-2 text-muted text-sm leading-relaxed">
              What you have to make to pass, measured from the balance you started with. Reaching it
              once is not enough on its own: no single session may be more than half of everything
              you won.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Trailing drawdown</dt>
            <dd className="mt-2 text-muted text-sm leading-relaxed">
              The floor that ends the account. It follows your highest equity up and never comes
              back down, then stops for good once it reaches a hundred above your starting balance.
              On a {PLANS[1].label} that is {formatDollars(trailStopsAt(PLANS[1]))} of equity.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Daily loss limit</dt>
            <dd className="mt-2 text-muted text-sm leading-relaxed">
              The floor that ends the day. It is measured from the balance you opened the session
              with and it resets with the next one. Unlike the trailing drawdown it does not move as
              you win.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Position limit</dt>
            <dd className="mt-2 text-muted text-sm leading-relaxed">
              The most you can hold at once, counted across everything open. Ten micros are one
              mini, so the two numbers are the same limit said twice.
            </dd>
          </div>
        </dl>

        <Link
          to={href("/rules")}
          className="mt-10 inline-flex rounded-sm text-muted text-sm transition-colors hover:text-ink focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
        >
          Read how the limits are enforced
        </Link>
      </div>
    </section>
  </>
);

export default Plans;
