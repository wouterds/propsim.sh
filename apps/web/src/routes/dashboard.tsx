import AccountHeader from "~/components/dashboard/account-header";
import { RULES, SESSIONS } from "~/components/dashboard/data";
import FloorMeter from "~/components/dashboard/floor-meter";
import RulesList from "~/components/dashboard/rules-list";
import SessionsTable from "~/components/dashboard/sessions-table";
import StatCard from "~/components/dashboard/stat-card";
import { ACCOUNT, dailyFloorOf, trailingFloorOf } from "~/lib/account";
import { formatMoney, formatSigned, toneOf } from "~/lib/format";
import type { Route } from "./+types/dashboard";

export const meta: Route.MetaFunction = () => [{ title: "Dashboard, propsim.sh" }];

export const loader = () => {
  const dailyFloor = dailyFloorOf(ACCOUNT);
  const trailingFloor = trailingFloorOf(ACCOUNT);
  const dayPnl = ACCOUNT.balance - ACCOUNT.sessionOpenEquity;
  const netPnl = ACCOUNT.balance - ACCOUNT.startingBalance;
  const toTarget = ACCOUNT.profitTarget - ACCOUNT.balance;

  return {
    account: ACCOUNT,
    rules: RULES,
    sessions: SESSIONS,
    dailyFloor,
    trailingFloor,
    dayPnl,
    netPnl,
    toTarget,
  };
};

const Dashboard = ({ loaderData }: Route.ComponentProps) => {
  const { account, rules, sessions, dailyFloor, trailingFloor, dayPnl, netPnl, toTarget } =
    loaderData;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <AccountHeader account={account} />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Balance"
          value={formatMoney(account.balance)}
          hint={`Started at ${formatMoney(account.startingBalance)}`}
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
          value={formatMoney(toTarget)}
          hint={`Target ${formatMoney(account.profitTarget)}`}
        />
      </div>

      <div className="mt-3 grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid min-w-0 gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <FloorMeter
              label="Daily floor"
              equity={account.balance}
              floor={dailyFloor}
              limit={account.dailyLossLimit}
              detail="Measured from the session open and reset with it. Breaching it ends the day, not the account."
            />
            <FloorMeter
              label="Trailing floor"
              equity={account.balance}
              floor={trailingFloor}
              limit={account.trailingDrawdown}
              detail="Measured from peak equity and never reset. It rises with a new high and stays there."
            />
          </div>

          <SessionsTable sessions={sessions} />
        </div>

        <RulesList rules={rules} />
      </div>
    </main>
  );
};

export default Dashboard;
