/** The plan terms an account trades under, copied onto it when it opens. */
export type AccountRules = {
  startingBalanceCents: number;
  profitTargetCents: number;
  trailingDrawdownCents: number;
  dailyLossLimitCents: number;
  lockAboveStartCents: number;
};

export type Breach = "daily_loss" | "trailing_drawdown";

export const lockedFloorOf = (rules: AccountRules) =>
  rules.startingBalanceCents + rules.lockAboveStartCents;

/** Resets with the session and is measured from where the equity opened it. */
export const dailyFloorOf = (rules: AccountRules, sessionOpenCents: number) =>
  sessionOpenCents - rules.dailyLossLimitCents;

/**
 * Follows the peak up and never comes back down. It stops at the locked floor,
 * and from there a further peak moves nothing.
 */
export const trailingFloorOf = (rules: AccountRules, peakEquityCents: number) =>
  Math.min(peakEquityCents - rules.trailingDrawdownCents, lockedFloorOf(rules));

export const targetOf = (rules: AccountRules) =>
  rules.startingBalanceCents + rules.profitTargetCents;

/**
 * The daily floor ends the session, never the account. Hitting it locks the
 * account out until the next session opens, and that lock needs no column of
 * its own: the session's low water mark already carries it, and only falls.
 */
export const lockedOutOf = (
  rules: AccountRules,
  day: { openEquityCents: number; lowEquityCents: number },
) => day.lowEquityCents <= dailyFloorOf(rules, day.openEquityCents);

/**
 * The trailing floor is the only one that ends the account. Read at the
 * deepest the equity went rather than where it settled, so a position that
 * went through and came back is still gone.
 */
export const failedOf = (
  rules: AccountRules,
  marks: { lowEquityCents: number; peakEquityCents: number },
) => marks.lowEquityCents <= trailingFloorOf(rules, marks.peakEquityCents);
