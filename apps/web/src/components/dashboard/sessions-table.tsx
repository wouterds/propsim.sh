import Badge from "~/components/dashboard/badge";
import { type Session, VERDICT_LABEL, VERDICT_TONE } from "~/components/dashboard/data";
import { formatMoney, formatSigned, TONE_TEXT, toneOf } from "~/lib/format";
import { cn } from "~/lib/utils";

type Props = {
  sessions: Session[];
};

const SessionsTable = ({ sessions }: Props) => (
  <div className="min-w-0 rounded-lg border border-line bg-raised">
    <div className="flex h-9 items-center border-line border-b px-4">
      <span className="text-[11px] text-faint uppercase tracking-wider">Recent sessions</span>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full min-w-[22rem] border-collapse">
        <thead>
          <tr className="border-line/60 border-b text-[11px] text-faint uppercase tracking-wider">
            <th className="h-8 px-4 text-left font-normal">Session</th>
            <th className="hidden h-8 px-4 text-right font-normal sm:table-cell">Trades</th>
            <th className="hidden h-8 px-4 text-right font-normal md:table-cell">Worst equity</th>
            <th className="h-8 px-4 text-right font-normal">P&amp;L</th>
            <th className="h-8 px-4 text-right font-normal">Rules</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr
              key={session.id}
              className="border-line/60 border-b last:border-b-0 hover:bg-overlay"
            >
              <td className="h-11 px-4">
                <span className="text-ink text-xs tabular">
                  {session.weekday} {session.date}
                </span>
                <span className="block text-[11px] text-faint">{session.note}</span>
              </td>
              <td className="hidden h-11 px-4 text-right text-ink text-xs tabular sm:table-cell">
                {session.trades}
              </td>
              <td className="hidden h-11 px-4 text-right text-down text-xs tabular md:table-cell">
                {formatMoney(session.worstEquity)}
              </td>
              <td
                className={cn(
                  "h-11 px-4 text-right font-medium text-xs tabular",
                  TONE_TEXT[toneOf(session.pnl)],
                )}
              >
                {formatSigned(session.pnl)}
              </td>
              <td className="h-11 px-4 text-right">
                <Badge tone={VERDICT_TONE[session.verdict]}>{VERDICT_LABEL[session.verdict]}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default SessionsTable;
