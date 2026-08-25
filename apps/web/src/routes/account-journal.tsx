import AccountHeader from "~/components/account/account-header";
import JournalTable from "~/components/journal/journal-table";
import StatCard from "~/components/ui/stat-card";
import { findAccount } from "~/lib/accounts";
import { formatMoney, formatPercent, formatSigned, toneOf } from "~/lib/format";
import { bestDayOf, greenDaysOf, winRateOf, worstDayOf } from "~/lib/journal";
import { PRIVATE } from "~/lib/seo";
import type { Route } from "./+types/account-journal";

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData ? `Journal, ${loaderData.account.name}, propsim.sh` : "Journal, propsim.sh" },
  ...PRIVATE,
];

export const loader = ({ params }: Route.LoaderArgs) => {
  const account = findAccount(params.id);

  if (!account) {
    throw new Response("No such account", { status: 404 });
  }

  const days = account.journal;

  return {
    account,
    days,
    winRate: winRateOf(days),
    green: greenDaysOf(days),
    best: bestDayOf(days),
    worst: worstDayOf(days),
  };
};

const Journal = ({ loaderData }: Route.ComponentProps) => {
  const { account, days, winRate, green, best, worst } = loaderData;
  const total = days.reduce((sum, day) => sum + day.pnl, 0);
  const trades = days.reduce((sum, day) => sum + day.trades, 0);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <AccountHeader account={account} />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Journal P&L"
          value={formatSigned(total)}
          tone={toneOf(total)}
          hint={`${days.length} sessions, ${trades} trades`}
        />
        <StatCard
          label="Green days"
          value={`${green} of ${days.length}`}
          hint={winRate === null ? "No trade taken yet" : `${formatPercent(winRate)} of trades won`}
        />
        <StatCard
          label="Best day"
          value={best ? formatSigned(best.pnl) : "0.00"}
          tone={best ? toneOf(best.pnl) : "neutral"}
          hint={best ? `${best.trades} trades` : undefined}
        />
        <StatCard
          label="Worst day"
          value={worst ? formatSigned(worst.pnl) : "0.00"}
          tone={worst ? toneOf(worst.pnl) : "neutral"}
          hint={worst ? `Drawdown ${formatMoney(worst.worstDrawdown)}` : undefined}
        />
      </div>

      <div className="mt-3">
        <JournalTable days={days} title="Every session" accountId={account.id} />
      </div>
    </main>
  );
};

export default Journal;
