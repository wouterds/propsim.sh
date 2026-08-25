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

const HEAD = "h-8 px-4 text-left font-normal";

const JournalTable = ({ days, title, accountId }: Props) => {
  const widest = Math.max(...days.map((day) => Math.abs(day.pnl)), 1);

  if (days.length === 0) {
    return (
      <div className="min-w-0 rounded-lg border border-line bg-raised">
        <div className="flex h-9 items-center border-line border-b px-4">
          <span className="text-[11px] text-faint uppercase tracking-wider">{title}</span>
        </div>
        <p className="px-4 py-8 text-center text-faint text-sm">
          Nothing traded yet. The first session shows up here once it closes.
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 rounded-lg border border-line bg-raised">
      <div className="flex h-9 items-center border-line border-b px-4">
        <span className="text-[11px] text-faint uppercase tracking-wider">{title}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[30rem] border-collapse">
          <thead>
            <tr className="border-line/60 border-b text-[11px] text-faint uppercase tracking-wider">
              <th className={HEAD}>Day</th>
              <th className={cn(HEAD, "text-right")}>Trades</th>
              <th className={cn(HEAD, "hidden text-right sm:table-cell")}>Won</th>
              <th className={cn(HEAD, "hidden text-right md:table-cell")}>Worst drawdown</th>
              <th className={cn(HEAD, "text-right")}>P&amp;L</th>
              <th className={cn(HEAD, "hidden lg:table-cell")}>
                <span className="sr-only">Size of the day</span>
              </th>
              <th className={cn(HEAD, "text-right")}>Rules</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr
                key={day.date}
                className="border-line/60 border-b last:border-b-0 hover:bg-overlay"
              >
                <td className="h-11 px-4 text-xs tabular">
                  {accountId ? (
                    <Link
                      to={href("/accounts/:id/journal/:date", { id: accountId, date: day.date })}
                      className="rounded-sm text-ink transition-colors hover:text-accent focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
                    >
                      {formatDay(day.date)}
                    </Link>
                  ) : (
                    <span className="text-ink">{formatDay(day.date)}</span>
                  )}
                </td>
                <td className="h-11 px-4 text-right text-ink text-xs tabular">{day.trades}</td>
                <td className="hidden h-11 px-4 text-right text-muted text-xs tabular sm:table-cell">
                  {day.wins}
                </td>
                <td className="hidden h-11 px-4 text-right text-down text-xs tabular md:table-cell">
                  {formatMoney(day.worstDrawdown)}
                </td>
                <td
                  className={cn(
                    "h-11 px-4 text-right font-medium text-xs tabular",
                    TONE_TEXT[toneOf(day.pnl)],
                  )}
                >
                  {formatSigned(day.pnl)}
                </td>
                <td className="hidden h-11 w-28 px-4 lg:table-cell">
                  <span className="flex h-1 items-center gap-px" aria-hidden="true">
                    <span className="flex h-full flex-1 justify-end">
                      {day.pnl < 0 && (
                        <span
                          className="h-full rounded-l-full bg-down"
                          style={{ width: `${(Math.abs(day.pnl) / widest) * 100}%` }}
                        />
                      )}
                    </span>
                    <span className="flex h-full flex-1">
                      {day.pnl > 0 && (
                        <span
                          className="h-full rounded-r-full bg-up"
                          style={{ width: `${(day.pnl / widest) * 100}%` }}
                        />
                      )}
                    </span>
                  </span>
                </td>
                <td className="h-11 px-4 text-right">
                  <Badge tone={VERDICT_TONE[day.verdict]}>{VERDICT_LABEL[day.verdict]}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JournalTable;
