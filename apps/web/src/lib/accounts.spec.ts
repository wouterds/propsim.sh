import { planOr } from "@propsim/plans";
import { describe, expect, it } from "vitest";
import { type Account, trailingFloorOf } from "./accounts";

const plan = planOr("daily-50k");

const at = (peakEquity: number): Account => ({
  id: "spec",
  planId: plan.id,
  name: "spec",
  openedOn: "2026-08-01",
  status: "live",
  balance: peakEquity,
  peakEquity,
  sessionOpenEquity: peakEquity,
  journal: [],
});

describe("trailingFloorOf", () => {
  it("should sit a full drawdown under the peak while the floor is still climbing", () => {
    // given a peak that has not yet carried the floor up to the lock
    const account = at(51_000);

    // then
    expect(trailingFloorOf(account)).toBe(49_000);
  });

  it("should stop at the locked floor once the peak carries it there", () => {
    // given a peak far above the point where the floor locks
    const account = at(60_000);

    // then
    expect(trailingFloorOf(account)).toBe(50_100);
  });

  it("should not move again after a further peak", () => {
    // given
    const locked = trailingFloorOf(at(52_100));

    // then
    expect(locked).toBe(50_100);
    expect(trailingFloorOf(at(90_000))).toBe(locked);
  });
});
