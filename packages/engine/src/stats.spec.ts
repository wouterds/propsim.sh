import { describe, expect, it } from "vitest";
import { type Fill, ledgerOf, type RoundTrip, type Side } from "./fills";
import { priceUnits } from "./money";
import { consistencyOf, statsOf } from "./stats";

const trip = (
  pnlCents: number,
  feeCents: number,
  tradeDate: string,
  heldSeconds = 60,
): RoundTrip => ({
  instrument: "MES",
  side: "buy",
  quantity: 1,
  entry: 0,
  exit: 0,
  pnlCents,
  feeCents,
  openedAt: new Date(Date.UTC(2026, 7, 26, 14)),
  closedAt: new Date(Date.UTC(2026, 7, 26, 14, 0, heldSeconds)),
  tradeDate,
});

describe("statsOf", () => {
  it("should say nothing rather than zero about a record with no trades", () => {
    // given
    const stats = statsOf([]);

    // when, then
    expect(stats.trades).toBe(0);
    expect(stats.winRate).toBeNull();
    expect(stats.profitFactor).toBeNull();
    expect(stats.averageHeldSeconds).toBeNull();
    expect(stats.bestDayCents).toBeNull();
  });

  it("should count a trade that made less than it cost as a loss", () => {
    // given a trip that moved 40 cents and paid 100 in commission
    const stats = statsOf([trip(40, 100, "2026-08-26")]);

    // when, then
    expect(stats.wins).toBe(0);
    expect(stats.pnlCents).toBe(-60);
    expect(stats.grossLossCents).toBe(60);
  });

  it("should take commission off the profit and still report it", () => {
    // given two winners, each charged
    const stats = statsOf([trip(500, 100, "2026-08-26"), trip(300, 100, "2026-08-26")]);

    // when, then
    expect(stats.pnlCents).toBe(600);
    expect(stats.feesCents).toBe(200);
  });

  it("should divide what was won by what was given back", () => {
    // given 900 net won and 300 net given back
    const stats = statsOf([trip(1_000, 100, "2026-08-26"), trip(-200, 100, "2026-08-26")]);

    // when, then
    expect(stats.grossWinCents).toBe(900);
    expect(stats.grossLossCents).toBe(300);
    expect(stats.profitFactor).toBe(3);
  });

  it("should refuse a profit factor rather than divide by a day with no losses", () => {
    // given only winners
    const stats = statsOf([trip(500, 0, "2026-08-26")]);

    // when, then
    expect(stats.profitFactor).toBeNull();
    expect(stats.averageLossCents).toBeNull();
  });

  it("should average the hold over the trips, not over the sessions", () => {
    // given three trips of different lengths in one session
    const stats = statsOf([
      trip(100, 0, "2026-08-26", 30),
      trip(100, 0, "2026-08-26", 60),
      trip(100, 0, "2026-08-26", 90),
    ]);

    // when, then
    expect(stats.averageHeldSeconds).toBe(60);
    expect(stats.sessions).toBe(1);
  });

  it("should read the best and worst day off the sessions, not off the trades", () => {
    // given a good day made of two trades and a bad day made of one
    const stats = statsOf([
      trip(500, 0, "2026-08-25"),
      trip(400, 0, "2026-08-25"),
      trip(-300, 0, "2026-08-26"),
    ]);

    // when, then
    expect(stats.sessions).toBe(2);
    expect(stats.bestDayCents).toBe(900);
    expect(stats.worstDayCents).toBe(-300);
  });
});

describe("consistencyOf", () => {
  const START = 5_000_000;
  let minute = 0;

  const fill = (side: Side, price: number, day: number): Fill => ({
    instrument: "MES",
    side,
    quantity: 1,
    price: priceUnits(price),
    feeCents: 0,
    at: new Date(Date.UTC(2026, 7, day, 14, minute++)),
    tradeDate: `2026-08-${day}`,
  });

  it("should say nothing while the account is not in profit", () => {
    // given a best day that never made the account whole
    const held = ledgerOf(
      [
        fill("buy", 5_000, 25),
        fill("sell", 5_120, 25),
        fill("buy", 5_000, 26),
        fill("sell", 4_820, 26),
      ],
      START,
    );

    // then
    expect(consistencyOf(held)).toBeNull();
  });

  it("should measure the best day against net profit, so a loss makes it worse", () => {
    // given 600 won, 200 won and 400 given back, which is 400 of account profit
    const held = ledgerOf(
      [
        fill("buy", 5_000, 24),
        fill("sell", 5_120, 24),
        fill("buy", 5_000, 25),
        fill("sell", 5_040, 25),
        fill("buy", 5_000, 26),
        fill("sell", 4_920, 26),
      ],
      START,
    );

    // then
    expect(consistencyOf(held)).toBe(1.5);
  });
});
