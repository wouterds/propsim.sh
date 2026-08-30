import { balanceOf, equityOf, type Ledger } from "./fills";
import { type AccountRules, failedDuringOf, failedOf, targetOf } from "./floors";
import { consistencyOf } from "./stats";

/** What a fill stream has done to an account, if anything. */
export type Outcome = "trailing_drawdown" | "target_met" | null;

/**
 * The whole decision, off the fill stream and two numbers. Pulled out of the
 * write so it can be read from a literal array of fills, because a wrong answer
 * here ends somebody's account and throws nothing on the way.
 *
 * Where it stands now against the floor as it stands now, and the history
 * against the floor as it stood at each print. Never the session's stored low
 * against today's floor: that low belongs to a moment when the peak, and so the
 * floor, was lower, and reading the two together ends an account on a trade that
 * made money.
 *
 * The daily floor is judged nowhere here. It shuts the session and leaves the
 * account alone.
 */
export const outcomeOf = (
  rules: AccountRules,
  ledger: Ledger,
  peakEquityCents: number,
  /** The share of the profit one session may hold before the target counts. */
  consistencyCap: number,
): Outcome => {
  const failed =
    failedOf(rules, { lowEquityCents: equityOf(ledger), peakEquityCents }) ||
    failedDuringOf(rules, ledger.path, ledger.startingCents);

  if (failed) {
    return "trailing_drawdown";
  }

  // Banked, never floating. A target met on an open position is money the
  // account has not made, and the screen has always counted it this way.
  if (balanceOf(ledger) < targetOf(rules)) {
    return null;
  }

  // The target alone passes nothing. One session carrying more than its share
  // of the profit keeps the account trading until the rest catch up.
  return (consistencyOf(ledger) ?? 0) <= consistencyCap ? "target_met" : null;
};
