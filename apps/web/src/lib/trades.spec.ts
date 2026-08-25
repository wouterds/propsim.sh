import { describe, expect, it } from "vitest";
import type { JournalDay } from "./journal";
import { tradesOf } from "./trades";

const day: JournalDay = {
  date: "2026-08-25",
  trades: 6,
  wins: 4,
  worstDrawdown: -412,
  pnl: 282,
  verdict: "watch",
};

describe("tradesOf", () => {
  it("should make as many trades as the day counted", () => {
    // then
    expect(tradesOf(day)).toHaveLength(day.trades);
  });

  it("should have as many winners as the day counted", () => {
    // then
    expect(tradesOf(day).filter((trade) => trade.pnl > 0)).toHaveLength(day.wins);
  });

  it("should add up to the day, near enough to the tick it rounds to", () => {
    // given each trade rounded to a quarter
    const total = tradesOf(day).reduce((sum, trade) => sum + trade.pnl, 0);

    // then
    expect(Math.abs(total - day.pnl)).toBeLessThan(day.trades * 0.25);
  });

  it("should tell the same story every time it is asked", () => {
    // then
    expect(tradesOf(day)).toEqual(tradesOf(day));
  });

  it("should order the day forwards", () => {
    // given
    const times = tradesOf(day).map((trade) => trade.at);

    // then
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});
