import { describe, expect, it } from "vitest";
import { type Fill, ledgerOf, type Side } from "./fills";
import { type DayAnchor, summariseDays } from "./journal";
import { priceUnits } from "./money";

const START = 5_000_000;
const LIMIT = 120_000;
const DATE = "2026-08-25";

let minute = 0;

const fill = (side: Side, quantity: number, price: number): Fill => {
  minute += 1;

  return {
    instrument: "MNQ",
    side,
    quantity,
    price: priceUnits(price),
    feeCents: 0,
    at: new Date(Date.UTC(2026, 7, 25, 14, minute)),
    tradeDate: DATE,
  };
};

const anchor = (lowEquityCents = START): DayAnchor => ({
  tradeDate: DATE,
  openEquityCents: START,
  lowEquityCents,
});

describe("summariseDays", () => {
  it("should breach a session that went through the floor and closed flat", () => {
    // given a day that lost 1,400 dollars and then won all of it back
    const fills = [
      fill("buy", 1, 20_000),
      fill("sell", 1, 19_300),
      fill("buy", 1, 19_300),
      fill("sell", 1, 20_000),
    ];

    // when the session is summarised
    const [day] = summariseDays(ledgerOf(fills, START), [anchor()], LIMIT);

    // then the deepest point decides it, not where the day settled
    expect(day.verdict).toBe("breached");
    expect(day.pnlCents).toBe(0);
    expect(day.worstDrawdownCents).toBe(-140_000);
    expect(day.trades).toBe(2);
    expect(day.wins).toBe(1);
  });

  it("should read the stored low of a session no fill ever reached", () => {
    // given a day whose equity dipped between two prints, half the limit down
    const stored = anchor(START - LIMIT / 2);

    // when the session is summarised
    const [day] = summariseDays(ledgerOf([], START), [stored], LIMIT);

    // then half is not yet worth flagging
    expect(day.verdict).toBe("clean");
    expect(day.worstDrawdownCents).toBe(-60_000);
  });

  it("should flag a session one cent past half the limit", () => {
    // given the same day, a cent deeper
    const stored = anchor(START - LIMIT / 2 - 1);

    // then
    expect(summariseDays(ledgerOf([], START), [stored], LIMIT)[0].verdict).toBe("watch");
  });

  it("should count a mark that no fill produced", () => {
    // given a long left open and the tape a hundred points under it
    const fills = [fill("buy", 1, 20_000)];
    const mark = { at: new Date(), tradeDate: DATE, equityCents: START - 20_000 };

    // when the session is summarised against that mark
    const [day] = summariseDays(ledgerOf(fills, START), [anchor()], LIMIT, mark);

    // then the open loss counts against the session as a closed one would
    expect(day.pnlCents).toBe(-20_000);
    expect(day.worstDrawdownCents).toBe(-20_000);
  });
});
