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

type Reading = {
  /** The deepest the equity went, not where it settled. */
  lowEquityCents: number;
  peakEquityCents: number;
  sessionOpenCents: number;
};

export const breachOf = (rules: AccountRules, reading: Reading): Breach | null => {
  if (reading.lowEquityCents <= trailingFloorOf(rules, reading.peakEquityCents)) {
    return "trailing_drawdown";
  }

  if (reading.lowEquityCents <= dailyFloorOf(rules, reading.sessionOpenCents)) {
    return "daily_loss";
  }

  return null;
};
