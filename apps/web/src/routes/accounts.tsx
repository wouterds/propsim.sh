import { href, Link } from "react-router";
import AccountCard from "~/components/account/account-card";
import StatCard from "~/components/ui/stat-card";
import { ACCOUNTS, totalsOf } from "~/lib/accounts";
import { formatMoney, formatSigned, toneOf } from "~/lib/format";
import { PRIVATE } from "~/lib/seo";
import type { Route } from "./+types/accounts";

export const meta: Route.MetaFunction = () => [{ title: "Accounts, propsim.sh" }, ...PRIVATE];

export const loader = () => ({ accounts: ACCOUNTS, totals: totalsOf(ACCOUNTS) });

const Accounts = ({ loaderData }: Route.ComponentProps) => {
  const { accounts, totals } = loaderData;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-ink text-xl tracking-tight">Accounts</h1>
          <p className="mt-1 text-faint text-xs tabular">
            {totals.live} live, {totals.accounts} in total
          </p>
        </div>

        <Link
          to={href("/accounts/new")}
          className="inline-flex h-9 items-center rounded bg-accent-strong px-4 font-medium text-sm text-ink transition-colors hover:bg-accent-strong/85 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
        >
          New account
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Balance" value={formatMoney(totals.balance)} hint="Every account" />
        <StatCard
          label="Net P&L"
          value={formatSigned(totals.netPnl)}
          tone={toneOf(totals.netPnl)}
          hint={`${totals.trades} trades logged`}
        />
        <StatCard
          label="Simulated"
          value={formatMoney(totals.allocated)}
          hint="Starting balances added up"
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {accounts.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}
      </div>
    </main>
  );
};

export default Accounts;
