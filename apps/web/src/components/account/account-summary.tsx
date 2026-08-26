import type { Plan } from "@propsim/plans";
import AccountHeader from "~/components/account/account-header";
import FloorMeter from "~/components/account/floor-meter";
import RulesList from "~/components/account/rules-list";
import JournalTable from "~/components/journal/journal-table";
import StatCard from "~/components/ui/stat-card";
import {
  type Account,
  dailyFloorOf,
  dayPnlOf,
  isOpen,
  lockAtOf,
  netPnlOf,
  targetOf,
  toLockOf,
  trailingFloorOf,
} from "~/lib/accounts";
import { formatMoney, formatSigned, toneOf } from "~/lib/format";
import type { Rule } from "~/lib/rules";

type Props = {
  account: Account;
  plan: Plan;
  rules: Rule[];
};

/** The whole overview, so the route is a loader and this is the page. */
const AccountSummary = ({ account, plan, rules }: Props) => {
  const netPnl = netPnlOf(account);
  const dayPnl = dayPnlOf(account);
  const toTarget = targetOf(account) - account.balance;
  const live = isOpen(account.status);
  const toLock = toLockOf(account);

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
          hint={
            account.feesPaid > 0
              ? `After ${formatMoney(account.feesPaid)} in commission`
              : "Commission comes out of this"
          }
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
              equity={account.equity}
              floor={dailyFloorOf(account)}
              limit={plan.dailyLossLimit}
              live={live}
              extra={{
                term: "Session opened at",
                value: formatMoney(account.sessionOpenEquity),
              }}
              detail="Measured from the session open and reset with it. Breaching it ends the day, not the account."
            />
            <FloorMeter
              label="Trailing floor"
              equity={account.equity}
              floor={trailingFloorOf(account)}
              limit={plan.trailingDrawdown}
              live={live}
              // The peak is what this floor follows, and the lock is where it
              // stops following. Both belong beside it rather than anywhere else.
              extra={{
                term: toLock > 0 ? "Peak, and the floor locks at" : "Peak, and the floor is locked",
                value:
                  toLock > 0 ? (
                    <>
                      {formatMoney(account.peakEquity)}
                      <span className="text-faint">
                        {" "}
                        · {formatMoney(lockAtOf(account))}, {formatMoney(toLock)} away
                      </span>
                    </>
                  ) : (
                    <>
                      {formatMoney(account.peakEquity)}
                      <span className="text-faint"> · it cannot move again</span>
                    </>
                  ),
              }}
              detail="Measured from peak equity and never reset. It rises with a new high and stays there."
            />
          </div>

          <JournalTable
            days={account.journal.slice(0, 5)}
            title="Recent sessions"
            accountId={account.id}
          />
        </div>

        <RulesList rules={rules} />
      </div>
    </main>
  );
};

export default AccountSummary;
