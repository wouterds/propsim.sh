import { useState } from "react";
import { Avatar } from "~/components/identity/avatar";
import { personaOf } from "~/components/identity/persona";
import Badge from "~/components/ui/badge";
import StatCard from "~/components/ui/stat-card";
import {
  formatDate,
  formatMoney,
  formatPercent,
  formatSigned,
  TONE_TEXT,
  toneOf,
} from "~/lib/format";
import { pageMeta } from "~/lib/seo";
import { loadTrader } from "~/lib/trader.server";
import { cn } from "~/lib/utils";
import type { Route } from "./+types/trader";

export const meta: Route.MetaFunction = ({ loaderData }) => {
  if (!loaderData) {
    return [];
  }

  return pageMeta({
    title: `${loaderData.name}, propsim.sh`,
    description: `${loaderData.name} has traded ${loaderData.stats.trades} round trips across ${loaderData.counts.total} simulated prop accounts on propsim.sh.`,
    path: `/traders/${loaderData.id}`,
  });
};

export const loader = async ({ params }: Route.LoaderArgs) => {
  const trader = await loadTrader(params.id);

  if (!trader) {
    throw new Response("No such trader", { status: 404 });
  }

  const persona = personaOf(trader.id, trader.username);

  return { ...trader, name: persona.name, persona };
};

const LINKS = [
  { key: "twitter", label: "X", at: (handle: string) => `https://x.com/${handle}` },
  {
    key: "youtube",
    label: "YouTube",
    at: (handle: string) => `https://youtube.com/@${handle}`,
  },
  { key: "twitch", label: "Twitch", at: (handle: string) => `https://twitch.tv/${handle}` },
] as const;

const FILTERS = [
  { key: "all", label: "All" },
  { key: "live", label: "Active" },
  { key: "breached", label: "Breached" },
] as const;

type Filter = (typeof FILTERS)[number]["key"];

const held = (seconds: number | null) => {
  if (seconds === null) return "–";
  if (seconds < 60) return `${Math.round(seconds)}s`;

  const minutes = Math.round(seconds / 60);

  return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

const STATE_LABEL = { live: "Live", passed: "Passed", breached: "Breached" } as const;
const STATE_TONE = { live: "up", passed: "accent", breached: "down" } as const;

const Detail = ({ term, value }: { term: string; value: string }) => (
  <div>
    <dt className="text-faint text-xs">{term}</dt>
    <dd className="mt-1 text-ink text-sm tabular">{value}</dd>
  </div>
);

const Trader = ({ loaderData }: Route.ComponentProps) => {
  const { accounts, counts, gone, joinedOn, links, name, persona, showsAccounts, stats } =
    loaderData;
  const [filter, setFilter] = useState<Filter>("all");
  const shown = accounts.filter((one) => filter === "all" || one.state === filter);
  const pnl = stats.pnlCents / 100;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar persona={persona} size={56} />

        <div className="min-w-0">
          <h1 className="font-semibold text-2xl text-ink tracking-tight">{name}</h1>
          <p className="mt-1 text-faint text-sm">
            {gone
              ? "This trader has left"
              : `Trading here since ${formatDate(joinedOn.slice(0, 10))}`}
          </p>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {LINKS.map((link) =>
            links[link.key] ? (
              <a
                key={link.key}
                href={link.at(links[link.key] as string)}
                rel="me noopener noreferrer nofollow"
                target="_blank"
                className="inline-flex h-8 items-center rounded border border-line px-3 text-muted text-sm transition-colors hover:text-ink focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
              >
                {link.label}
              </a>
            ) : null,
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total P&L"
          value={formatSigned(pnl)}
          tone={toneOf(pnl)}
          hint={`Banked across ${counts.total} ${counts.total === 1 ? "account" : "accounts"}`}
        />
        <StatCard
          label="Toward target"
          value={loaderData.targetShare === null ? "–" : formatPercent(loaderData.targetShare)}
          tone={toneOf(pnl)}
          hint={`Of ${formatMoney(loaderData.targetWas)} in profit targets`}
        />
        <StatCard
          label="Accounts passed"
          value={`${counts.passed}`}
          tone={counts.passed > 0 ? "up" : "neutral"}
          hint={`${counts.breached} breached, ${counts.live} live`}
        />
        <StatCard
          label="Win rate"
          value={stats.winRate === null ? "–" : formatPercent(stats.winRate)}
          hint={
            stats.trades === 0
              ? "No trade closed yet"
              : `${stats.wins} of ${stats.trades} round trips`
          }
        />
      </div>

      <div className="mt-3 min-w-0 rounded-lg border border-line bg-raised">
        <div className="flex h-9 items-center border-line border-b px-4">
          <span className="text-[11px] text-faint uppercase tracking-wider">The record</span>
        </div>

        <dl className="grid grid-cols-2 gap-y-5 p-4 sm:grid-cols-4">
          <Detail term="Round trips" value={`${stats.trades}`} />
          <Detail term="Sessions traded" value={`${stats.sessions}`} />
          <Detail term="Average hold" value={held(stats.averageHeldSeconds)} />
          <Detail
            term="Profit factor"
            value={stats.profitFactor === null ? "–" : stats.profitFactor.toFixed(2)}
          />
          <Detail
            term="Average win"
            value={stats.averageWinCents === null ? "–" : formatMoney(stats.averageWinCents / 100)}
          />
          <Detail
            term="Average loss"
            value={
              stats.averageLossCents === null ? "–" : formatMoney(stats.averageLossCents / 100)
            }
          />
          <Detail
            term="Best session"
            value={stats.bestDayCents === null ? "–" : formatSigned(stats.bestDayCents / 100)}
          />
          <Detail
            term="Worst session"
            value={stats.worstDayCents === null ? "–" : formatSigned(stats.worstDayCents / 100)}
          />
        </dl>

        <p className="border-line/70 border-t px-4 py-3 text-muted text-xs leading-relaxed">
          Every figure is after commission, which has cost {formatMoney(stats.feesCents / 100)} so
          far. A trade that made less than it cost to take is counted as a loss.
        </p>
      </div>

      {showsAccounts && (
        <div className="mt-3 min-w-0 rounded-lg border border-line bg-raised">
          <div className="flex h-9 flex-wrap items-center justify-between gap-2 border-line border-b px-4">
            <span className="text-[11px] text-faint uppercase tracking-wider">Accounts</span>

            <div className="-mr-1.5 flex items-center gap-1">
              {FILTERS.map((one) => (
                <button
                  key={one.key}
                  type="button"
                  onClick={() => setFilter(one.key)}
                  className={cn(
                    "inline-flex h-6 items-center rounded px-2 text-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent",
                    filter === one.key ? "bg-line text-ink" : "text-faint hover:text-ink",
                  )}
                >
                  {one.label}
                </button>
              ))}
            </div>
          </div>

          {shown.length === 0 ? (
            <p className="px-4 py-8 text-center text-faint text-sm">Nothing here.</p>
          ) : (
            <ul>
              {shown.map((account) => (
                <li
                  key={account.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 border-line/60 border-b px-4 py-3 last:border-b-0"
                >
                  <span className="text-ink text-sm">{account.plan}</span>
                  <Badge tone={STATE_TONE[account.state]}>{STATE_LABEL[account.state]}</Badge>
                  <span className="text-faint text-xs">opened {formatDate(account.openedOn)}</span>
                  <span
                    className={cn(
                      "ml-auto font-medium text-sm tabular",
                      TONE_TEXT[toneOf(account.pnl)],
                    )}
                  >
                    {formatSigned(account.pnl)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </main>
  );
};

export default Trader;
