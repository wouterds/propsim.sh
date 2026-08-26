import { toDollars } from "@propsim/engine";
import { href, Link } from "react-router";
import Board from "~/components/leaderboard/board";
import SpanSwitcher from "~/components/leaderboard/span-switcher";
import StatCard from "~/components/ui/stat-card";
import { formatPercent, formatSigned, toneOf } from "~/lib/format";
import { periodOf, spanOr } from "~/lib/leaderboard";
import { loadLeaderboard } from "~/lib/leaderboard.server";
import { pageMeta } from "~/lib/seo";
import type { Route } from "./+types/leaderboards";

export const meta: Route.MetaFunction = () =>
  pageMeta({
    title: "Leaderboards, propsim.sh",
    description:
      "Who is up and who is down on a simulated futures account, over seven days, thirty days and all time. Nothing here is real money.",
    path: "/leaderboards",
  });

export const loader = async ({ url }: Route.LoaderArgs) => {
  const span = spanOr(url.searchParams.get("span"));

  return { span, ...(await loadLeaderboard(span)) };
};

const Leaderboards = ({ loaderData }: Route.ComponentProps) => {
  const { span, winners, losers, traders, accounts, passed, breached, profitable, median } =
    loaderData;

  const period = periodOf(span);

  return (
    <>
      <section className="border-line/70 border-b">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="max-w-3xl">
            <h1 className="font-semibold text-4xl text-ink leading-[1.1] tracking-tight">
              Leaderboards
            </h1>
            <p className="mt-6 text-muted leading-relaxed">
              Every number here was made on a simulated account against a prop firm's rules. No
              money was at stake and nothing was ordered. Traders show up under the name they chose,
              or under one the site drew for them.
            </p>
          </div>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Profitable"
              value={profitable === null ? "--" : formatPercent(profitable)}
              hint={`Of ${traders} ${traders === 1 ? "trader" : "traders"}, over ${period}`}
              tone={profitable === null ? "neutral" : toneOf(profitable - 0.5)}
            />
            <StatCard
              label="Median trader"
              value={median === null ? "--" : formatSigned(toDollars(median))}
              hint={`The middle of the field, over ${period}`}
              tone={median === null ? "neutral" : toneOf(median)}
            />
            <StatCard
              label="Accounts passed"
              value={String(passed)}
              hint={`Of ${accounts} opened, all time`}
              tone={passed > 0 ? "up" : "neutral"}
            />
            <StatCard
              label="Accounts breached"
              value={String(breached)}
              hint="A floor ended these, all time"
              tone={breached > 0 ? "down" : "neutral"}
            />
          </div>
        </div>
      </section>

      <section className="border-line/70 border-b">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-semibold text-2xl text-ink tracking-tight">Who is up</h2>
            <SpanSwitcher value={span} />
          </div>

          <div className="mt-8 grid gap-3 lg:grid-cols-2">
            <Board
              title="Up"
              hint={period}
              empty="Nobody is up over this period yet."
              rows={winners}
            />
            <Board
              title="Down"
              hint={period}
              empty="Nobody is down over this period yet."
              rows={losers}
            />
          </div>

          <p className="mt-8 max-w-2xl text-faint text-xs leading-relaxed">
            Ranked on profit banked inside the period, so a position still open counts for nothing
            until it closes. The percentage beside it is measured against the balance the account
            started with, which is what lets a 25K and a 150K stand next to each other.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <h2 className="font-semibold text-2xl text-ink tracking-tight">Want your name on it</h2>
          <p className="mt-4 max-w-2xl text-muted leading-relaxed">
            Open an account, trade the live tape against the rules, and pick a name in settings. Do
            nothing and you still appear, under a name the site drew for you.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to={href("/plans")}
              className="inline-flex h-9 items-center justify-center rounded bg-accent-strong px-4 font-medium text-white text-sm transition-colors hover:bg-accent-strong/85 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
            >
              Get a free account
            </Link>
            <Link
              to={href("/rules")}
              className="rounded-sm text-muted text-sm transition-colors hover:text-ink focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
            >
              Read the rules first
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Leaderboards;
