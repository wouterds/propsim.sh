import { planOr } from "@propsim/plans";
import { describe, expect, it } from "vitest";
import { type Account, dayPnlOf, trailingFloorOf } from "./accounts";

const plan = planOr("daily-50k");

const account = (overrides: Partial<Account> = {}): Account => ({
  id: "spec",
  name: "spec",
  openedOn: "2026-08-01",
  status: "live",
  plan,
  balance: plan.size,
  equity: plan.size,
  peakEquity: plan.size,
  sessionOpenEquity: plan.size,
  journal: [],
  ...overrides,
});

const at = (peakEquity: number) => account({ peakEquity, balance: peakEquity, equity: peakEquity });

describe("trailingFloorOf", () => {
  it("should sit a full drawdown under the peak while the floor is still climbing", () => {
    // given a peak that has not yet carried the floor up to the lock
    // then
    expect(trailingFloorOf(at(51_000))).toBe(49_000);
  });

  it("should stop at the locked floor once the peak carries it there", () => {
    // given a peak far above the point where the floor locks
    // then
    expect(trailingFloorOf(at(60_000))).toBe(50_100);
  });

  it("should not move again after a further peak", () => {
    // given
    const locked = trailingFloorOf(at(52_100));

    // then
    expect(locked).toBe(50_100);
    expect(trailingFloorOf(at(90_000))).toBe(locked);
  });
});

describe("dayPnlOf", () => {
  it("should count an open position against the session as a closed one would", () => {
    // given a session that opened flat and is holding a loser it has not banked
    const holding = account({
      sessionOpenEquity: 50_000,
      balance: 50_000,
      equity: 49_400,
    });

    // then the day is down by the open loss, not flat by the untouched balance
    expect(dayPnlOf(holding)).toBe(-600);
  });
});
