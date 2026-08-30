import { planOr } from "@propsim/plans";
import { describe, expect, it } from "vitest";
import type { Account, Ending } from "./accounts";
import { rulesOf } from "./rules";

const plan = planOr("daily-50k");

const account = (endedReason: Ending | null): Account => ({
  id: "spec",
  name: "spec",
  openedOn: "2026-08-26",
  status: endedReason === null ? "live" : endedReason === "target_met" ? "passed" : "breached",
  plan,
  balance: 52_382.5,
  equity: 52_382.5,
  peakEquity: 52_382.5,
  sessionOpenEquity: 50_000,
  feesPaid: 5,
  consistency: null,
  endedAt: endedReason === null ? null : "2026-08-26T13:51:00.000Z",
  endedReason,
  journal: [],
});

const stateOf = (endedReason: Ending | null, id: string) =>
  rulesOf(account(endedReason)).find((rule) => rule.id === id)?.state;

describe("rulesOf", () => {
  it("should not fail the drawdown for an account a release ended", () => {
    // given an account closed for holding through a red folder window, with an
    // equity nowhere near its trailing floor
    // then failing the drawdown here sends a trader hunting for a give back
    // that never happened
    expect(stateOf("news", "trailing")).toBe("clean");
    expect(stateOf("news", "news")).toBe("breached");
  });

  it("should fail the drawdown only when the drawdown is what ended it", () => {
    // then
    expect(stateOf("trailing_drawdown", "trailing")).toBe("breached");
    expect(stateOf("trailing_drawdown", "news")).toBe("clean");
  });

  it("should leave every rule clean on an account that passed", () => {
    // given a target met, which ends an account without breaking anything
    expect(stateOf("target_met", "trailing")).toBe("clean");
    expect(stateOf("target_met", "daily")).toBe("clean");
    expect(stateOf("target_met", "target")).toBe("clean");
  });

  it("should leave a live account's floors alone", () => {
    // then
    expect(stateOf(null, "trailing")).toBe("clean");
    expect(stateOf(null, "daily")).toBe("clean");
  });
});
