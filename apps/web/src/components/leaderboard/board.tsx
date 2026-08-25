import { Avatar } from "@propsim/identity";
import { formatPercent, formatSigned, TONE_TEXT, toneOf } from "~/lib/format";
import type { Row } from "~/lib/leaderboard.server";
import { cn } from "~/lib/utils";

type Props = {
  title: string;
  hint: string;
  empty: string;
  rows: Row[];
};

const Board = ({ title, hint, empty, rows }: Props) => (
  <section className="flex flex-col rounded-lg border border-line bg-raised">
    <div className="flex items-baseline justify-between gap-4 border-line/70 border-b px-5 py-4">
      <h2 className="font-medium text-ink">{title}</h2>
      <p className="text-[11px] text-faint uppercase tracking-wider">{hint}</p>
    </div>

    {rows.length === 0 ? (
      <p className="px-5 py-8 text-center text-faint text-sm">{empty}</p>
    ) : (
      <ol className="divide-y divide-line/70">
        {rows.map((row) => (
          <li key={row.name} className="flex items-center gap-3 px-5 py-3">
            <span className="w-4 shrink-0 text-right text-faint text-xs tabular">{row.rank}</span>

            <Avatar persona={row} size={28} />

            <div className="min-w-0 flex-1">
              <p className="truncate text-ink text-sm">{row.name}</p>
              <p className="text-[11px] text-faint">
                {row.accounts === 1 ? "1 account" : `${row.accounts} accounts`}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className={cn("font-medium text-sm tabular", TONE_TEXT[toneOf(row.pnl)])}>
                {formatSigned(row.pnl)}
              </p>
              <p className="text-[11px] text-faint tabular">{formatPercent(row.return)}</p>
            </div>
          </li>
        ))}
      </ol>
    )}
  </section>
);

export default Board;
