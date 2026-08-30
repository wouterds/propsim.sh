import { planOr } from "@propsim/plans";
import { describe, expect, it } from "vitest";
import { type Account, combinedJournalOf } from "./accounts";
import { type JournalDay, winRateOf } from "./journal";

const day = (pnl: number, trades = 1, wins = 0): JournalDay => ({
  date: "2026-08-25",
  trades,
  wins,
  worstDrawdown: 0,
  pnl,
  verdict: "clean",
});

describe("winRateOf", () => {
  it("should return null when no trade was taken", () => {
    // given
    const days = [day(0, 0, 0)];

    // then
    expect(winRateOf(days)).toBeNull();
  });

  it("should count wins over every trade, not over the days", () => {
    // given
    const days = [day(100, 4, 3), day(-50, 1, 0)];

    // then
    expect(winRateOf(days)).toBe(0.6);
  });
});

const plan = planOr("daily-50k");

const account = (journal: JournalDay[]): Account => ({
  id: "spec",
  name: "spec",
  openedOn: "2026-08-01",
  status: "live",
  plan,
  balance: plan.size,
  equity: plan.size,
  peakEquity: plan.size,
  sessionOpenEquity: plan.size,
  feesPaid: 0,
  consistency: null,
  endedAt: null,
  endedReason: null,
  journal,
});

describe("combinedJournalOf", () => {
  it("should keep the worst verdict when two accounts traded the same day", () => {
    // given
    const accounts = [
      account([{ ...day(100), date: "2026-08-25", verdict: "clean" }]),
      account([{ ...day(-50), date: "2026-08-25", verdict: "breached" }]),
    ];

    // when
    const combined = combinedJournalOf(accounts);

    // then
    expect(combined).toHaveLength(1);
    expect(combined[0]?.verdict).toBe("breached");
    expect(combined[0]?.pnl).toBe(50);
  });

  it("should order the calendar newest first", () => {
    // given
    const accounts = [
      account([
        { ...day(10), date: "2026-08-19" },
        { ...day(20), date: "2026-08-24" },
      ]),
    ];

    // then
    expect(combinedJournalOf(accounts).map((entry) => entry.date)).toEqual([
      "2026-08-24",
      "2026-08-19",
    ]);
  });
});
