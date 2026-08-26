import { describe, expect, it } from "vitest";
import { type AccountRules, breachOf, floorOf, trailingFloorOf } from "./floors";

const rules: AccountRules = {
  startingBalanceCents: 5_000_000,
  profitTargetCents: 300_000,
  trailingDrawdownCents: 200_000,
  dailyLossLimitCents: 120_000,
  lockAboveStartCents: 10_000,
};

describe("trailingFloorOf", () => {
  it("should sit a full drawdown under the peak while it is still climbing", () => {
    // given a peak that has not carried the floor up to the lock
    // then
    expect(trailingFloorOf(rules, 5_100_000)).toBe(4_900_000);
  });

  it("should stop at the locked floor and stay there through a further peak", () => {
    // given two peaks, both far above the point where the floor locks
    const locked = trailingFloorOf(rules, 5_210_000);

    // then
    expect(locked).toBe(5_010_000);
    expect(trailingFloorOf(rules, 9_000_000)).toBe(locked);
  });
});

describe("breachOf", () => {
  it("should count equity that only touched the daily floor as a breach", () => {
    // given a session that went exactly one daily limit below its open
    const reading = {
      lowEquityCents: 4_880_000,
      peakEquityCents: 5_000_000,
      sessionOpenCents: 5_000_000,
    };

    // then
    expect(breachOf(rules, reading)).toBe("daily_loss");
  });

  it("should leave a cent above the daily floor alone", () => {
    // given the same session, one cent shallower
    const reading = {
      lowEquityCents: 4_880_001,
      peakEquityCents: 5_000_000,
      sessionOpenCents: 5_000_000,
    };

    // then
    expect(breachOf(rules, reading)).toBeNull();
  });

  it("should name the trailing floor when both floors were taken out", () => {
    // given a session deep enough to break the daily limit and the drawdown with it
    const reading = {
      lowEquityCents: 4_700_000,
      peakEquityCents: 5_000_000,
      sessionOpenCents: 5_000_000,
    };

    // then the floor that ends the account wins over the one that ends the day
    expect(breachOf(rules, reading)).toBe("trailing_drawdown");
  });
});

describe("floorOf", () => {
  it("should take the daily floor while it sits above the trailing one", () => {
    // given a session that opened at the starting balance and never ran up
    // then the daily limit is the shallower of the two, so it is met first
    expect(floorOf(rules, { peakEquityCents: 5_000_000, sessionOpenCents: 5_000_000 })).toBe(
      4_880_000,
    );
  });

  it("should take the trailing floor once a losing session has fallen past it", () => {
    // given a session that opened well down, dragging its daily floor under the drawdown
    // then
    expect(floorOf(rules, { peakEquityCents: 5_000_000, sessionOpenCents: 4_900_000 })).toBe(
      4_800_000,
    );
  });
});
