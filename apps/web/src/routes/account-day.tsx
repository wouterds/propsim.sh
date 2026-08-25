import { href, Link } from "react-router";
import AccountHeader from "~/components/account/account-header";
import Badge from "~/components/ui/badge";
import StatCard from "~/components/ui/stat-card";
import { findAccount } from "~/lib/accounts";
import { formatDay, formatMoney, formatSigned, TONE_TEXT, toneOf } from "~/lib/format";
import { VERDICT_LABEL, VERDICT_TONE } from "~/lib/journal";
import { tradesOf } from "~/lib/trades";
import { cn } from "~/lib/utils";
import type { Route } from "./+types/account-day";

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData ? `${loaderData.day.label}, propsim.sh` : "Session, propsim.sh" },
];

const CLOCK = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "UTC",
  hour12: false,
});

const held = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);

  return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

export const loader = ({ params }: Route.LoaderArgs) => {
  const account = findAccount(params.id);
  const entry = account?.journal.find((row) => row.date === params.date);

  if (!account || !entry) {
    throw new Response("No such session", { status: 404 });
  }

  return {
    account,
    day: { ...entry, label: formatDay(entry.date) },
    trades: tradesOf(entry).map((trade) => ({
      ...trade,
      time: CLOCK.format(new Date(trade.at)),
      duration: held(trade.seconds),
    })),
  };
};

const HEAD = "h-8 px-4 text-left font-normal text-[11px] text-faint uppercase tracking-wider";

const Day = ({ loaderData }: Route.ComponentProps) => {
  const { account, day, trades } = loaderData;
  const gross = trades.filter((trade) => trade.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
  const given = trades.filter((trade) => trade.pnl < 0).reduce((sum, t) => sum + t.pnl, 0);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <AccountHeader account={account} />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          to={href("/accounts/:id/journal", { id: account.id })}
          className="rounded-sm text-muted text-sm transition-colors hover:text-ink focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
        >
          Journal
        </Link>
        <span className="text-faint">/</span>
        <h2 className="font-medium text-ink">{day.label}</h2>
        <Badge tone={VERDICT_TONE[day.verdict]}>{VERDICT_LABEL[day.verdict]}</Badge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Session P&L"
          value={formatSigned(day.pnl)}
          tone={toneOf(day.pnl)}
          hint={`${day.trades} trades, ${day.wins} won`}
        />
        <StatCard label="Won" value={formatSigned(gross)} tone="up" hint="Before the losers" />
        <StatCard label="Given back" value={formatSigned(given)} tone="down" hint="The losers" />
        <StatCard
          label="Worst drawdown"
          value={formatMoney(day.worstDrawdown)}
          tone="down"
          hint="Deepest the session went"
        />
      </div>

      <div className="mt-3 min-w-0 rounded-lg border border-line bg-raised">
        <div className="flex h-9 items-center border-line border-b px-4">
          <span className="text-[11px] text-faint uppercase tracking-wider">Trades</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[38rem] border-collapse">
            <thead>
              <tr className="border-line/60 border-b">
                <th className={HEAD}>Time</th>
                <th className={HEAD}>Side</th>
                <th className={cn(HEAD, "text-right")}>Qty</th>
                <th className={cn(HEAD, "text-right")}>Entry</th>
                <th className={cn(HEAD, "text-right")}>Exit</th>
                <th className={cn(HEAD, "hidden text-right sm:table-cell")}>Held</th>
                <th className={cn(HEAD, "text-right")}>P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr
                  key={trade.id}
                  className="border-line/60 border-b last:border-b-0 hover:bg-overlay"
                >
                  <td className="h-11 px-4 text-ink text-xs tabular">{trade.time}</td>
                  <td className="h-11 px-4">
                    <span
                      className={cn(
                        "text-xs uppercase tracking-wider",
                        trade.side === "buy" ? "text-up" : "text-down",
                      )}
                    >
                      {trade.side}
                    </span>
                  </td>
                  <td className="h-11 px-4 text-right text-ink text-xs tabular">
                    {trade.quantity}
                  </td>
                  <td className="h-11 px-4 text-right text-muted text-xs tabular">
                    {formatMoney(trade.entry)}
                  </td>
                  <td className="h-11 px-4 text-right text-muted text-xs tabular">
                    {formatMoney(trade.exit)}
                  </td>
                  <td className="hidden h-11 px-4 text-right text-faint text-xs tabular sm:table-cell">
                    {trade.duration}
                  </td>
                  <td
                    className={cn(
                      "h-11 px-4 text-right font-medium text-xs tabular",
                      TONE_TEXT[toneOf(trade.pnl)],
                    )}
                  >
                    {formatSigned(trade.pnl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-faint text-xs">
        Fills are invented for now. They add up to the session and win as often as it did.
      </p>
    </main>
  );
};

export default Day;
