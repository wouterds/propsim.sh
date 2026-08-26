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

type Marks = {
  peakEquityCents: number;
  sessionOpenCents: number;
};

type Reading = Marks & {
  /** The deepest the equity went, not where it settled. */
  lowEquityCents: number;
};

/**
 * The floor equity meets first on the way down, which is the higher of the two.
 * `breachOf` names the rule that ended the account, this is the price level it
 * was ended at, and a liquidation fills there.
 */
export const floorOf = (rules: AccountRules, marks: Marks) =>
  Math.max(
    trailingFloorOf(rules, marks.peakEquityCents),
    dailyFloorOf(rules, marks.sessionOpenCents),
  );

export const breachOf = (rules: AccountRules, reading: Reading): Breach | null => {
  if (reading.lowEquityCents <= trailingFloorOf(rules, reading.peakEquityCents)) {
    return "trailing_drawdown";
  }

  if (reading.lowEquityCents <= dailyFloorOf(rules, reading.sessionOpenCents)) {
    return "daily_loss";
  }

  return null;
};
