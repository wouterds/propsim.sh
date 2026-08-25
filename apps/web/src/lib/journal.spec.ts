import { describe, expect, it } from "vitest";
import { ACCOUNTS, combinedJournalOf } from "./accounts";
import { concentrationOf, type JournalDay, winRateOf } from "./journal";

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

describe("concentrationOf", () => {
  it("should return null when nothing was won", () => {
    // given
    const days = [day(-100), day(-40)];

    // then
    expect(concentrationOf(days)).toBeNull();
  });

  it("should measure the best day against net profit, so a loss makes it worse", () => {
    // given 800 won and 400 given back, which is 400 of account profit
    const days = [day(600), day(200), day(-400)];

    // then
    expect(concentrationOf(days)).toBe(1.5);
  });

  it("should give nothing back while the account is not in profit", () => {
    // given a best day that never made the account whole
    const days = [day(600), day(-900)];

    // then
    expect(concentrationOf(days)).toBeNull();
  });
});

describe("combinedJournalOf", () => {
  it("should keep the worst verdict when two accounts traded the same day", () => {
    // given
    const accounts = [
      { ...ACCOUNTS[0], journal: [{ ...day(100), date: "2026-08-25", verdict: "clean" as const }] },
      {
        ...ACCOUNTS[1],
        journal: [{ ...day(-50), date: "2026-08-25", verdict: "breached" as const }],
      },
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
      {
        ...ACCOUNTS[0],
        journal: [
          { ...day(10), date: "2026-08-19" },
          { ...day(20), date: "2026-08-24" },
        ],
      },
    ];

    // then
    expect(combinedJournalOf(accounts).map((entry) => entry.date)).toEqual([
      "2026-08-24",
      "2026-08-19",
    ]);
  });
});
