import { href, Link } from "react-router";
import Badge from "~/components/ui/badge";
import { formatDay, formatMoney, formatSigned, TONE_TEXT, toneOf } from "~/lib/format";
import { type JournalDay, VERDICT_LABEL, VERDICT_TONE } from "~/lib/journal";
import { cn } from "~/lib/utils";

type Props = {
  days: JournalDay[];
  title: string;
  /** When given, each row opens that account's session. */
  accountId?: string;
};

/**
 * A grid rather than a table, because the whole row is one link. An anchor
 * stretched inside a table row escapes it: a row is not a containing block in
 * every browser, and the hit area then covers the page instead of the row.
 */
const ROW =
  "grid grid-cols-[1fr_auto] items-center gap-x-4 px-4 sm:grid-cols-[1fr_3rem_3rem_5rem]" +
  " md:grid-cols-[1fr_3rem_3rem_8rem_7rem_5rem] lg:grid-cols-[1fr_3rem_3rem_8rem_7rem_7rem_5rem]";

const HEAD = "text-[11px] text-faint uppercase tracking-wider";

const Shell = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="min-w-0 rounded-lg border border-line bg-raised">
    <div className="flex h-9 items-center border-line border-b px-4">
      <span className="text-[11px] text-faint uppercase tracking-wider">{title}</span>
    </div>
    {children}
  </div>
);

const JournalTable = ({ days, title, accountId }: Props) => {
  const widest = Math.max(...days.map((day) => Math.abs(day.pnl)), 1);

  if (days.length === 0) {
    return (
      <Shell title={title}>
        <p className="px-4 py-8 text-center text-faint text-sm">
          Nothing traded yet. The first session shows up here once it closes.
        </p>
      </Shell>
    );
  }

  return (
    <Shell title={title}>
      <div className={cn(ROW, "h-8 border-line/60 border-b")}>
        <span className={HEAD}>Day</span>
        <span className={cn(HEAD, "hidden text-right sm:block")}>Trades</span>
        <span className={cn(HEAD, "hidden text-right sm:block")}>Won</span>
        <span className={cn(HEAD, "hidden text-right md:block")}>Worst drawdown</span>
        <span className={cn(HEAD, "hidden text-right sm:block")}>P&amp;L</span>
        <span className={cn(HEAD, "hidden lg:block")} />
        <span className={cn(HEAD, "text-right")}>Rules</span>
      </div>

      <ul>
        {days.map((day) => {
          const cells = (
            <>
              <span className="truncate text-ink text-xs tabular">{formatDay(day.date)}</span>
              <span className="hidden text-right text-ink text-xs tabular sm:block">
                {day.trades}
              </span>
              <span className="hidden text-right text-muted text-xs tabular sm:block">
                {day.wins}
              </span>
              <span className="hidden text-right text-down text-xs tabular md:block">
                {formatMoney(day.worstDrawdown)}
              </span>
              <span
                className={cn(
                  "hidden text-right font-medium text-xs tabular sm:block",
                  TONE_TEXT[toneOf(day.pnl)],
                )}
              >
                {formatSigned(day.pnl)}
              </span>

              <span className="hidden lg:flex lg:items-center lg:gap-px">
                <span className="flex flex-1 justify-end">
                  {day.pnl < 0 && (
                    <span
                      className="h-1 rounded-full bg-down"
                      style={{ width: `${(Math.abs(day.pnl) / widest) * 100}%` }}
                    />
                  )}
                </span>
                <span className="flex flex-1">
                  {day.pnl > 0 && (
                    <span
                      className="h-1 rounded-full bg-up"
                      style={{ width: `${(day.pnl / widest) * 100}%` }}
                    />
                  )}
                </span>
              </span>

              <span className="flex justify-end">
                <Badge tone={VERDICT_TONE[day.verdict]}>{VERDICT_LABEL[day.verdict]}</Badge>
              </span>
            </>
          );

          return (
            <li key={day.date} className="border-line/60 border-b last:border-b-0">
              {accountId ? (
                <Link
                  to={href("/accounts/:id/journal/:date", { id: accountId, date: day.date })}
                  className={cn(
                    ROW,
                    "h-11 transition-colors hover:bg-overlay/60 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent",
                  )}
                >
                  {cells}
                </Link>
              ) : (
                <div className={cn(ROW, "h-11")}>{cells}</div>
              )}
            </li>
          );
        })}
      </ul>
    </Shell>
  );
};

export default JournalTable;
