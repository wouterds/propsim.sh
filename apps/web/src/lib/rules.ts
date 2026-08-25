import {
  type Account,
  dailyFloorOf,
  netPnlOf,
  planOf,
  targetOf,
  trailingFloorOf,
} from "./accounts";
import { formatMoney } from "./format";
import { concentrationOf, greenDaysOf, type Verdict } from "./journal";

export type Rule = {
  id: string;
  label: string;
  detail: string;
  state: Verdict;
};

const CONSISTENCY_CAP = 0.4;

const breachedOr = (account: Account, state: Verdict): Verdict =>
  account.status === "breached" ? "breached" : state;

export const rulesOf = (account: Account): Rule[] => {
  const plan = planOf(account);
  const daysTraded = account.journal.length;
  const concentration = concentrationOf(account.journal);
  const left = targetOf(account) - account.balance;

  return [
    {
      id: "daily",
      label: "Daily loss limit",
      detail: `${formatMoney(plan.dailyLossLimit)} from the session open, reset at 17:00 CT. Floor at ${formatMoney(dailyFloorOf(account))}.`,
      state: breachedOr(account, "clean"),
    },
    {
      id: "trailing",
      label: "Trailing drawdown",
      detail: `${formatMoney(plan.trailingDrawdown)} from a peak of ${formatMoney(account.peakEquity)}. Floor at ${formatMoney(trailingFloorOf(account))}, and it never comes back down.`,
      state: breachedOr(account, "clean"),
    },
    {
      id: "target",
      label: "Profit target",
      detail:
        left <= 0
          ? `Met. ${formatMoney(netPnlOf(account))} against a target of ${formatMoney(plan.profitTarget)}.`
          : `${formatMoney(left)} left to reach ${formatMoney(targetOf(account))}.`,
      state: left <= 0 ? "clean" : "watch",
    },
    {
      id: "days",
      label: "Minimum trading days",
      detail: `${daysTraded} traded, ${plan.minimumDays} required.`,
      state: daysTraded >= plan.minimumDays ? "clean" : "watch",
    },
    {
      id: "consistency",
      label: `Consistency, ${Math.round(CONSISTENCY_CAP * 100)}%`,
      detail:
        concentration === null
          ? "No winning day yet. It applies once the account is in profit."
          : `Your best day is ${Math.round(concentration * 100)}% of everything won.`,
      state: concentration !== null && concentration > CONSISTENCY_CAP ? "watch" : "clean",
    },
    {
      id: "green",
      label: "Green days",
      detail: `${greenDaysOf(account.journal)} of ${daysTraded} sessions finished up.`,
      state: "clean",
    },
  ];
};
