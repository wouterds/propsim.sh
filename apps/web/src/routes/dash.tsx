import AccountRail from "~/components/account/account-rail";
import JournalTable from "~/components/journal/journal-table";
import StatCard from "~/components/ui/stat-card";
import { ACCOUNTS, combinedJournalOf, totalsOf } from "~/lib/accounts";
import { formatMoney, formatPercent, formatSigned, toneOf } from "~/lib/format";
import { greenDaysOf, winRateOf } from "~/lib/journal";
import { PRIVATE } from "~/lib/seo";
import type { Route } from "./+types/dash";

export const meta: Route.MetaFunction = () => [{ title: "Overview, propsim.sh" }, ...PRIVATE];

export const loader = () => {
  const days = combinedJournalOf(ACCOUNTS);

  return {
    accounts: ACCOUNTS,
    totals: totalsOf(ACCOUNTS),
    days,
    winRate: winRateOf(days),
    green: greenDaysOf(days),
  };
};

const Dashboard = ({ loaderData }: Route.ComponentProps) => {
  const { accounts, totals, days, winRate, green } = loaderData;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <h1 className="font-semibold text-ink text-xl tracking-tight">Overview</h1>
      <p className="mt-1 text-faint text-xs tabular">
        {totals.live} of {totals.accounts} accounts live · {formatMoney(totals.allocated)} simulated
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Balance"
          value={formatMoney(totals.balance)}
          hint={`Across ${totals.accounts} accounts`}
        />
        <StatCard
          label="Net P&L"
          value={formatSigned(totals.netPnl)}
          tone={toneOf(totals.netPnl)}
          hint={`${totals.trades} trades logged`}
        />
        <StatCard
          label="Day P&L"
          value={formatSigned(totals.dayPnl)}
          tone={toneOf(totals.dayPnl)}
          hint="Every live account, this session"
        />
        <StatCard
          label="Green days"
          value={`${green} of ${days.length}`}
          hint={winRate === null ? "No trade taken yet" : `${formatPercent(winRate)} of trades won`}
        />
      </div>

      <div className="mt-3 grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <JournalTable days={days} title="Every session, all accounts" />
        <AccountRail accounts={accounts} />
      </div>
    </main>
  );
};

export default Dashboard;
