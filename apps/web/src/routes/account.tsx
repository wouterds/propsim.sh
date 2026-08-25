import { href, Link } from "react-router";
import AccountHeader from "~/components/account/account-header";
import FloorMeter from "~/components/account/floor-meter";
import RulesList from "~/components/account/rules-list";
import JournalTable from "~/components/journal/journal-table";
import StatCard from "~/components/ui/stat-card";
import {
  dailyFloorOf,
  dayPnlOf,
  findAccount,
  netPnlOf,
  planOf,
  targetOf,
  trailingFloorOf,
} from "~/lib/accounts";
import { formatMoney, formatSigned, toneOf } from "~/lib/format";
import { rulesOf } from "~/lib/rules";
import { PRIVATE } from "~/lib/seo";
import type { Route } from "./+types/account";

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData ? `${loaderData.account.name}, propsim.sh` : "Account, propsim.sh" },
  ...PRIVATE,
];

export const loader = ({ params }: Route.LoaderArgs) => {
  const account = findAccount(params.id);

  if (!account) {
    throw new Response("No such account", { status: 404 });
  }

  return { account, plan: planOf(account), rules: rulesOf(account) };
};

const Account = ({ loaderData }: Route.ComponentProps) => {
  const { account, plan, rules } = loaderData;
  const netPnl = netPnlOf(account);
  const dayPnl = dayPnlOf(account);
  const toTarget = targetOf(account) - account.balance;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <AccountHeader account={account} />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Balance"
          value={formatMoney(account.balance)}
          hint={`Started at ${formatMoney(plan.size)}`}
        />
        <StatCard
          label="Net P&L"
          value={formatSigned(netPnl)}
          tone={toneOf(netPnl)}
          hint={`Peak equity ${formatMoney(account.peakEquity)}`}
        />
        <StatCard
          label="Day P&L"
          value={formatSigned(dayPnl)}
          tone={toneOf(dayPnl)}
          hint={`Session opened at ${formatMoney(account.sessionOpenEquity)}`}
        />
        <StatCard
          label="To the target"
          value={toTarget <= 0 ? "Met" : formatMoney(toTarget)}
          hint={`Target ${formatMoney(targetOf(account))}`}
        />
      </div>

      <div className="mt-3 grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid min-w-0 gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <FloorMeter
              label="Daily floor"
              equity={account.balance}
              floor={dailyFloorOf(account)}
              limit={plan.dailyLossLimit}
              detail="Measured from the session open and reset with it. Breaching it ends the day, not the account."
            />
            <FloorMeter
              label="Trailing floor"
              equity={account.balance}
              floor={trailingFloorOf(account)}
              limit={plan.trailingDrawdown}
              detail="Measured from peak equity and never reset. It rises with a new high and stays there."
            />
          </div>

          <JournalTable
            days={account.journal.slice(0, 5)}
            title="Recent sessions"
            accountId={account.id}
          />

          <Link
            to={href("/accounts/:id/journal", { id: account.id })}
            className="w-fit rounded-sm text-muted text-xs transition-colors hover:text-ink focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
          >
            Open the full journal
          </Link>
        </div>

        <RulesList rules={rules} />
      </div>
    </main>
  );
};

export default Account;
