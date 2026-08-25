import { describe, expect, it } from "vitest";
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

  it("should measure the best day against the winning days only", () => {
    // given a losing day that must not shrink the share
    const days = [day(600), day(200), day(-400)];

    // then
    expect(concentrationOf(days)).toBe(0.75);
  });
});
