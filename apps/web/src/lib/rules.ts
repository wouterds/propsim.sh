import type { Verdict } from "@propsim/engine";
import { CONSISTENCY_CAP, lockedFloorOf } from "@propsim/plans";
import {
  type Account,
  dailyFloorOf,
  netPnlOf,
  planOf,
  targetOf,
  trailingFloorOf,
} from "./accounts";
import { formatMoney } from "./format";
import { greenDaysOf } from "./journal";

export type Rule = {
  id: string;
  label: string;
  detail: string;
  state: Verdict;
};

/**
 * Only the rule that actually ended it. Painting every rule red because the
 * account is over sends a trader looking for a drawdown that never happened,
 * which is what a release or a target does to this list.
 */
const endedOn = (account: Account, reason: Account["endedReason"]): boolean =>
  account.endedReason === reason;

const targetDetailOf = (account: Account, left: number, overweight: boolean) => {
  const plan = planOf(account);

  if (left > 0) {
    return `${formatMoney(left)} left to reach ${formatMoney(targetOf(account))}.`;
  }

  if (overweight && account.status !== "passed") {
    return `Reached, but one session holds too much of it. Keep trading until your best day is ${Math.round(CONSISTENCY_CAP * 100)}% or less of the profit.`;
  }

  return `Met. ${formatMoney(netPnlOf(account))} against a target of ${formatMoney(plan.profitTarget)}.`;
};

export const rulesOf = (account: Account): Rule[] => {
  const plan = planOf(account);
  const daysTraded = account.journal.length;
  const concentration = account.consistency;
  const overweight = concentration !== null && concentration > CONSISTENCY_CAP;
  const left = targetOf(account) - account.balance;

  return [
    {
      id: "daily",
      label: "Daily loss limit",
      detail:
        account.status === "locked"
          ? `Hit. Trading is shut until the next session opens at 17:00 CT, and the account itself is untouched.`
          : `${formatMoney(plan.dailyLossLimit)} from the session open, reset at 17:00 CT. Floor at ${formatMoney(dailyFloorOf(account))}.`,
      state: account.status === "locked" || endedOn(account, "daily_loss") ? "breached" : "clean",
    },
    {
      id: "trailing",
      label: "Trailing drawdown",
      detail:
        trailingFloorOf(account) >= lockedFloorOf(plan)
          ? `Locked at ${formatMoney(lockedFloorOf(plan))}. It stopped following the peak and cannot move again.`
          : `${formatMoney(plan.trailingDrawdown)} from a peak of ${formatMoney(account.peakEquity)}. Floor at ${formatMoney(trailingFloorOf(account))}, and it never comes back down.`,
      state: endedOn(account, "trailing_drawdown") ? "breached" : "clean",
    },
    {
      id: "news",
      label: "Red folder news",
      detail: endedOn(account, "news")
        ? "Hit. A position was open through a high impact release, which ends the account whether the trade won or lost."
        : "Be flat from a minute before a high impact release until a minute after it.",
      state: endedOn(account, "news") ? "breached" : "clean",
    },
    {
      id: "target",
      label: "Profit target",
      detail: targetDetailOf(account, left, overweight),
      state: left <= 0 || endedOn(account, "target_met") ? "clean" : "watch",
    },
    {
      id: "consistency",
      label: `Consistency, ${Math.round(CONSISTENCY_CAP * 100)}%`,
      detail:
        concentration === null
          ? "No winning day yet. It applies once the account is in profit."
          : `Your best day is ${Math.round(concentration * 100)}% of everything won.`,
      state: overweight ? "watch" : "clean",
    },
    {
      id: "green",
      label: "Green days",
      detail: `${greenDaysOf(account.journal)} of ${daysTraded} sessions finished up.`,
      state: "clean",
    },
  ];
};
