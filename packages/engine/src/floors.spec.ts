import { describe, expect, it } from "vitest";
import { type AccountRules, failedOf, lockedOutOf, trailingFloorOf } from "./floors";

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

describe("lockedOutOf", () => {
  it("should lock a session that went exactly one daily limit below its open", () => {
    // given a session opened at the starting balance and down the full limit
    const day = { openEquityCents: 5_000_000, lowEquityCents: 4_880_000 };

    // then touching the floor is enough, the same as every other floor here
    expect(lockedOutOf(rules, day)).toBe(true);
  });

  it("should leave a session a cent above its daily floor trading", () => {
    // given the same session, one cent shallower
    const day = { openEquityCents: 5_000_000, lowEquityCents: 4_880_001 };

    // then
    expect(lockedOutOf(rules, day)).toBe(false);
  });

  it("should measure from the session open rather than the starting balance", () => {
    // given a session that opened in profit and gave back less than the limit
    const day = { openEquityCents: 5_300_000, lowEquityCents: 5_190_000 };

    // then an account well above its start is still locked by its own session
    expect(lockedOutOf(rules, day)).toBe(false);
    expect(lockedOutOf(rules, { openEquityCents: 5_300_000, lowEquityCents: 5_180_000 })).toBe(
      true,
    );
  });

  it("should lock a losing session before the account is anywhere near failing", () => {
    // given a session that opened down and spent its limit again
    const day = { openEquityCents: 4_950_000, lowEquityCents: 4_830_000 };

    // then the day is over and the account is not: these are separate rules
    expect(lockedOutOf(rules, day)).toBe(true);
    expect(failedOf(rules, { lowEquityCents: 4_830_000, peakEquityCents: 5_000_000 })).toBe(false);
  });
});

describe("failedOf", () => {
  it("should not end an account that only broke its daily limit", () => {
    // given a session a full daily limit down, with the peak at the open
    // then the daily floor is 4,880,000 and the trailing floor is 4,800,000
    expect(failedOf(rules, { lowEquityCents: 4_880_000, peakEquityCents: 5_000_000 })).toBe(false);
  });

  it("should end an account that touched the trailing floor", () => {
    // given equity exactly a full drawdown under the peak
    expect(failedOf(rules, { lowEquityCents: 4_800_000, peakEquityCents: 5_000_000 })).toBe(true);
  });

  it("should leave a cent above the trailing floor alone", () => {
    // given the same reading, one cent shallower
    expect(failedOf(rules, { lowEquityCents: 4_800_001, peakEquityCents: 5_000_000 })).toBe(false);
  });

  it("should follow the peak up, so a level that was safe stops being safe", () => {
    // given equity that sat above the floor before the account ran up
    const reading = { lowEquityCents: 4_900_000, peakEquityCents: 5_000_000 };

    // when a later peak drags the floor up behind it
    // then the same equity now fails, which is the ratchet doing its job
    expect(failedOf(rules, reading)).toBe(false);
    expect(failedOf(rules, { ...reading, peakEquityCents: 5_100_000 })).toBe(true);
  });

  it("should stop following the peak once the floor locks", () => {
    // given a peak far past the point where the trailing floor stops climbing
    const locked = { lowEquityCents: 5_010_000, peakEquityCents: 9_000_000 };

    // then the floor is the locked one, not nine million less the drawdown
    expect(failedOf(rules, locked)).toBe(true);
    expect(failedOf(rules, { ...locked, lowEquityCents: 5_010_001 })).toBe(false);
  });
});
