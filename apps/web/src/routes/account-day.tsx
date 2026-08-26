import { href, Link } from "react-router";
import AccountHeader from "~/components/account/account-header";
import Badge from "~/components/ui/badge";
import StatCard from "~/components/ui/stat-card";
import { loadAccountDay } from "~/lib/accounts.server";
import { requireUserId } from "~/lib/auth.server";
import { formatDay, formatMoney, formatSigned, TONE_TEXT, toneOf } from "~/lib/format";
import { VERDICT_LABEL, VERDICT_TONE } from "~/lib/journal";
import { PRIVATE } from "~/lib/seo";
import { cn } from "~/lib/utils";
import type { Route } from "./+types/account-day";

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData ? `${loaderData.day.label}, propsim.sh` : "Session, propsim.sh" },
  ...PRIVATE,
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

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const session = await loadAccountDay(await requireUserId(request), params.id, params.date);

  if (!session) {
    throw new Response("No such session", { status: 404 });
  }

  return {
    account: session.account,
    day: { ...session.day, label: formatDay(session.day.date) },
    session: session.session,
    ended: session.ended ? { ...session.ended, time: CLOCK.format(session.ended.at) } : null,
    trades: session.trades.map((trade) => ({
      ...trade,
      time: CLOCK.format(new Date(trade.at)),
      duration: held(trade.seconds),
    })),
    fills: session.fills.map((fill) => ({ ...fill, time: CLOCK.format(new Date(fill.at)) })),
    placed: session.placed.map((order) => ({ ...order, time: CLOCK.format(new Date(order.at)) })),
  };
};

const HEAD = "h-8 px-4 text-left font-normal text-[11px] text-faint uppercase tracking-wider";

const STATUS_TONE = {
  filled: "up",
  partial: "warn",
  working: "accent",
  cancelled: "muted",
  replaced: "muted",
  expired: "muted",
} as const;
const CELL = "h-11 px-4 text-xs tabular";

type PanelProps = { title: string; note?: string; children: React.ReactNode };

const Panel = ({ title, note, children }: PanelProps) => (
  <div className="min-w-0 rounded-lg border border-line bg-raised">
    <div className="flex h-9 items-center justify-between gap-3 border-line border-b px-4">
      <span className="text-[11px] text-faint uppercase tracking-wider">{title}</span>
      {note && <span className="text-[11px] text-faint tabular">{note}</span>}
    </div>
    {children}
  </div>
);

const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="px-4 py-8 text-center text-faint text-sm">{children}</p>
);

const Side = ({ side }: { side: "buy" | "sell" }) => (
  <span
    className={cn("text-xs uppercase tracking-wider", side === "buy" ? "text-up" : "text-down")}
  >
    {side}
  </span>
);

const Day = ({ loaderData }: Route.ComponentProps) => {
  const { account, day, session, ended, trades, fills, placed } = loaderData;
  const won = trades.filter((trade) => trade.pnl > 0).reduce((sum, one) => sum + one.pnl, 0);
  const given = trades.filter((trade) => trade.pnl < 0).reduce((sum, one) => sum + one.pnl, 0);

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
        {session.lockedOut && <Badge tone="warn">Shut for the day</Badge>}
        {/* The header names the rule and the moment. What it cannot say is that
            it happened in the session being read. */}
        {ended && (
          <Badge tone={ended.reason === "target_met" ? "accent" : "down"}>
            Account ended here, {ended.time} UTC
          </Badge>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Session P&L"
          value={formatSigned(day.pnl)}
          tone={toneOf(day.pnl)}
          hint={`${day.trades} ${day.trades === 1 ? "trade" : "trades"}, ${day.wins} won`}
        />
        <StatCard label="Won" value={formatSigned(won)} tone="up" hint="Before the losers" />
        <StatCard label="Given back" value={formatSigned(given)} tone="down" hint="The losers" />
        <StatCard
          label="Commission"
          value={session.fees === 0 ? "0.00" : `-${formatMoney(session.fees)}`}
          tone={session.fees === 0 ? "neutral" : "down"}
          hint={`${fills.length} ${fills.length === 1 ? "fill" : "fills"}, charged per side`}
        />
      </div>

      <div className="mt-3">
        <Panel title="Where the floors stood">
          <dl className="grid grid-cols-2 gap-y-5 p-4 sm:grid-cols-4">
            <div>
              <dt className="text-faint text-xs">Opened on</dt>
              <dd className="mt-1 text-ink text-sm tabular">{formatMoney(session.openEquity)}</dd>
            </div>
            <div>
              <dt className="text-faint text-xs">Low water</dt>
              <dd className="mt-1 text-ink text-sm tabular">{formatMoney(session.lowEquity)}</dd>
            </div>
            <div>
              <dt className="text-faint text-xs">Daily floor</dt>
              <dd
                className={cn("mt-1 text-sm tabular", session.lockedOut ? "text-down" : "text-ink")}
              >
                {formatMoney(session.dailyFloor)}
              </dd>
            </div>
            <div>
              <dt className="text-faint text-xs">Trailing floor</dt>
              <dd className="mt-1 text-ink text-sm tabular">
                {formatMoney(session.trailingFloor)}
              </dd>
            </div>
          </dl>

          <p className="border-line/70 border-t px-4 py-3 text-muted text-xs leading-relaxed">
            The daily floor resets with the session and only shuts it. The trailing floor follows
            peak equity, never resets, and is the one that ends the account.
          </p>
        </Panel>
      </div>

      <div className="mt-3">
        <Panel
          title="Trades"
          note={`${trades.length} round ${trades.length === 1 ? "trip" : "trips"}`}
        >
          {trades.length === 0 ? (
            <Empty>Nothing closed in this session.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[42rem] border-collapse">
                <thead>
                  <tr className="border-line/60 border-b">
                    <th className={HEAD}>Closed</th>
                    <th className={HEAD}>Contract</th>
                    <th className={HEAD}>Side</th>
                    <th className={cn(HEAD, "text-right")}>Qty</th>
                    <th className={cn(HEAD, "text-right")}>Entry</th>
                    <th className={cn(HEAD, "text-right")}>Exit</th>
                    <th className={cn(HEAD, "hidden text-right sm:table-cell")}>Held</th>
                    <th className={cn(HEAD, "hidden text-right sm:table-cell")}>Fees</th>
                    <th className={cn(HEAD, "text-right")}>P&amp;L</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => (
                    <tr
                      key={trade.id}
                      className="border-line/60 border-b last:border-b-0 hover:bg-overlay"
                    >
                      <td className={cn(CELL, "text-ink")}>{trade.time}</td>
                      <td className={cn(CELL, "text-muted")}>{trade.instrument}</td>
                      <td className="h-11 px-4">
                        <Side side={trade.side} />
                      </td>
                      <td className={cn(CELL, "text-right text-ink")}>{trade.quantity}</td>
                      <td className={cn(CELL, "text-right text-muted")}>
                        {formatMoney(trade.entry)}
                      </td>
                      <td className={cn(CELL, "text-right text-muted")}>
                        {formatMoney(trade.exit)}
                      </td>
                      <td className={cn(CELL, "hidden text-right text-faint sm:table-cell")}>
                        {trade.duration}
                      </td>
                      <td className={cn(CELL, "hidden text-right text-faint sm:table-cell")}>
                        {trade.fees === 0 ? "–" : `-${formatMoney(trade.fees)}`}
                      </td>
                      <td
                        className={cn(CELL, "text-right font-medium", TONE_TEXT[toneOf(trade.pnl)])}
                      >
                        {formatSigned(trade.pnl)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-3">
        <Panel
          title="Fills"
          note={`${fills.length} ${fills.length === 1 ? "print" : "prints"}, UTC`}
        >
          {fills.length === 0 ? (
            <Empty>Nothing printed in this session.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[38rem] border-collapse">
                <thead>
                  <tr className="border-line/60 border-b">
                    <th className={HEAD}>Time</th>
                    <th className={HEAD}>Contract</th>
                    <th className={HEAD}>Side</th>
                    <th className={HEAD}>Order</th>
                    <th className={cn(HEAD, "text-right")}>Qty</th>
                    <th className={cn(HEAD, "text-right")}>Price</th>
                    <th className={cn(HEAD, "text-right")}>Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {fills.map((fill) => (
                    <tr
                      key={fill.id}
                      className="border-line/60 border-b last:border-b-0 hover:bg-overlay"
                    >
                      <td className={cn(CELL, "text-ink")}>{fill.time}</td>
                      <td className={cn(CELL, "text-muted")}>{fill.instrument}</td>
                      <td className="h-11 px-4">
                        <Side side={fill.side} />
                      </td>
                      <td className={cn(CELL, "text-faint")}>{fill.kind}</td>
                      <td className={cn(CELL, "text-right text-ink")}>{fill.quantity}</td>
                      <td className={cn(CELL, "text-right text-muted")}>
                        {formatMoney(fill.price)}
                      </td>
                      <td className={cn(CELL, "text-right text-faint")}>
                        {fill.fee === 0 ? "–" : `-${formatMoney(fill.fee)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
      <div className="mt-3">
        <Panel title="Orders" note={`${placed.length} placed`}>
          {placed.length === 0 ? (
            <Empty>No order was placed in this session.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[38rem] border-collapse">
                <thead>
                  <tr className="border-line/60 border-b">
                    <th className={HEAD}>Placed</th>
                    <th className={HEAD}>Contract</th>
                    <th className={HEAD}>Side</th>
                    <th className={HEAD}>Kind</th>
                    <th className={cn(HEAD, "text-right")}>Qty</th>
                    <th className={cn(HEAD, "text-right")}>Price</th>
                    <th className={cn(HEAD, "text-right")}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {placed.map((order) => (
                    <tr
                      key={order.id}
                      className="border-line/60 border-b last:border-b-0 hover:bg-overlay"
                    >
                      <td className={cn(CELL, "text-ink")}>{order.time}</td>
                      <td className={cn(CELL, "text-muted")}>{order.instrument}</td>
                      <td className="h-11 px-4">
                        <Side side={order.side} />
                      </td>
                      <td className={cn(CELL, "text-faint")}>{order.kind}</td>
                      <td className={cn(CELL, "text-right text-ink")}>
                        {order.filled > 0 && order.filled < order.quantity
                          ? `${order.filled} of ${order.quantity}`
                          : order.quantity}
                      </td>
                      <td className={cn(CELL, "text-right text-muted")}>
                        {order.price === null ? "market" : formatMoney(order.price)}
                      </td>
                      <td className="h-11 px-4 text-right">
                        <Badge tone={STATUS_TONE[order.status]}>{order.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </main>
  );
};

export default Day;
