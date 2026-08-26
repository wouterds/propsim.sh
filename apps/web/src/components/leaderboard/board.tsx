import { href, Link } from "react-router";
import { Avatar } from "~/components/identity/avatar";
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
      <ol>
        {rows.map((row) => (
          <li key={row.id} className="group/row relative p-1.5">
            <span className="flex items-center gap-3 rounded px-3 py-2 transition-colors group-hover/row:bg-overlay">
              <span className="w-4 shrink-0 text-right text-faint text-xs tabular">{row.rank}</span>

              <Avatar persona={row} size={28} />

              <span className="min-w-0 flex-1">
                {/* Stretched over the row, so the whole of it opens the profile
                    and still opens in a tab like any other link. */}
                <Link
                  to={href("/traders/:id", { id: row.id })}
                  className="block truncate rounded-sm text-ink text-sm after:absolute after:inset-0 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
                >
                  {row.name}
                </Link>
                <span className="block text-[11px] text-faint">
                  {row.accounts === 1 ? "1 account" : `${row.accounts} accounts`}
                </span>
              </span>

              <span className="shrink-0 text-right">
                <span
                  className={cn("block font-medium text-sm tabular", TONE_TEXT[toneOf(row.pnl)])}
                >
                  {formatSigned(row.pnl)}
                </span>
                <span className="block text-[11px] text-faint tabular">
                  {row.target === null ? "\u2013" : `${formatPercent(row.target)} of target`}
                </span>
              </span>
            </span>
          </li>
        ))}
      </ol>
    )}
  </section>
);

export default Board;
