import { describe, expect, it } from "vitest";
import { type Fill, ledgerOf, type Side } from "./fills";
import type { AccountRules } from "./floors";
import { priceUnits } from "./money";
import { outcomeOf } from "./outcome";

const START = 5_000_000;

// A 50K, with the published numbers: 3,000 target, 2,000 trailing drawdown.
const rules: AccountRules = {
  startingBalanceCents: START,
  profitTargetCents: 300_000,
  trailingDrawdownCents: 200_000,
  dailyLossLimitCents: 120_000,
  lockAboveStartCents: 10_000,
};

/** Half the profit at most from one session, which is what the firms publish. */
const CAP = 0.5;

let minute = 0;

const fill = (side: Side, quantity: number, price: number, day = 26): Fill => ({
  instrument: "MES",
  side,
  quantity,
  price: priceUnits(price),
  feeCents: 0,
  at: new Date(Date.UTC(2026, 7, day, 14, minute++)),
  tradeDate: `2026-08-${day}`,
});

/** MES is five dollars a point, so a point on one contract is 500 cents. */
const ledger = (fills: Fill[]) => ledgerOf(fills, START);

describe("outcomeOf", () => {
  it("should leave an account that has done nothing alone", () => {
    // given
    const held = ledger([]);

    // when, then
    expect(outcomeOf(rules, held, START, CAP)).toBeNull();
  });

  it("should end an account whose open loss reached the floor", () => {
    // given four hundred points against one contract, which is 2,000 dollars
    const held = ledger([fill("buy", 1, 5_000), fill("sell", 0, 5_000)]);
    const open = ledger([fill("buy", 1, 5_000)]);

    // when the mark is four hundred points below the entry
    open.marks.set("MES", priceUnits(4_600));

    // then the account is gone without anything being realised
    expect(outcomeOf(rules, open, START, CAP)).toBe("trailing_drawdown");
    expect(outcomeOf(rules, held, START, CAP)).toBeNull();
  });

  it("should leave a cent above the floor alone", () => {
    // given a loss one tick short of the drawdown
    const open = ledger([fill("buy", 1, 5_000)]);

    open.marks.set("MES", priceUnits(4_600.25));

    // when, then
    expect(outcomeOf(rules, open, START, CAP)).toBeNull();
  });

  it("should end an account on a dip it already recovered from", () => {
    // given a trade that went four hundred points down and closed flat
    const held = ledger([
      fill("buy", 1, 5_000),
      fill("sell", 1, 4_600),
      fill("buy", 1, 4_600),
      fill("sell", 1, 5_000),
    ]);

    // when the balance is back where it started
    expect(held.realisedCents).toBe(0);

    // then the moment it was under the floor still counts
    expect(outcomeOf(rules, held, START, CAP)).toBe("trailing_drawdown");
  });

  it("should not end an account whose own profit dragged the floor over an old dip", () => {
    // given a dip that was safe when it printed, then a run to a new high
    const held = ledger([
      fill("buy", 1, 5_000),
      fill("sell", 1, 4_900),
      fill("buy", 1, 4_900),
      fill("sell", 1, 5_300),
    ]);

    // when the peak the run reached would put the floor over that dip
    // then the dip is judged against the floor of its own moment
    expect(outcomeOf(rules, held, START, CAP)).not.toBe("trailing_drawdown");
  });

  it("should pass an account that banked the target over two even sessions", () => {
    // given three hundred points a day for two days, which is 3,000 dollars
    const held = ledger([
      fill("buy", 1, 5_000, 25),
      fill("sell", 1, 5_300, 25),
      fill("buy", 1, 5_000, 26),
      fill("sell", 1, 5_300, 26),
    ]);

    // when, then
    expect(outcomeOf(rules, held, START + 300_000, CAP)).toBe("target_met");
  });

  it("should keep an account trading when one session carries the target", () => {
    // given the whole target banked in one session
    const held = ledger([fill("buy", 1, 5_000), fill("sell", 1, 5_600)]);

    // when the best day is all of the profit
    // then the target is reached and the account is not passed
    expect(outcomeOf(rules, held, START + 300_000, CAP)).toBeNull();
  });

  it("should pass once the best day is exactly the cap", () => {
    // given 1,600 on one day and 1,600 on the next, over a 3,000 target
    const held = ledger([
      fill("buy", 1, 5_000, 25),
      fill("sell", 1, 5_320, 25),
      fill("buy", 1, 5_000, 26),
      fill("sell", 1, 5_320, 26),
    ]);

    // when, then
    expect(outcomeOf(rules, held, START + 320_000, CAP)).toBe("target_met");
  });

  it("should read the best day against net profit, so a losing day counts twice", () => {
    // given 1,800 won, 1,800 won and 600 given back, which is 3,000 of profit
    const held = ledger([
      fill("buy", 1, 5_000, 24),
      fill("sell", 1, 5_360, 24),
      fill("buy", 1, 5_000, 25),
      fill("sell", 1, 5_360, 25),
      fill("buy", 1, 5_000, 26),
      fill("sell", 1, 4_880, 26),
    ]);

    // when the best day is 1,800 of a 3,000 profit, which is 60%
    // then the account is still trading
    expect(outcomeOf(rules, held, START + 360_000, CAP)).toBeNull();
  });

  it("should not pass an account whose target is only floating", () => {
    // given the same profit, still open
    const open = ledger([fill("buy", 1, 5_000)]);

    open.marks.set("MES", priceUnits(5_600));

    // when the position has not been closed
    // then the money has not been made
    expect(outcomeOf(rules, open, START + 300_000, CAP)).toBeNull();
  });

  it("should end rather than pass when a run to the target went through the floor", () => {
    // given a target reached, on a path that dipped through the floor first
    const held = ledger([
      fill("buy", 1, 5_000),
      fill("sell", 1, 4_580),
      fill("buy", 1, 4_580),
      fill("sell", 1, 5_300),
    ]);

    // when both are true at once
    // then the breach wins, because it happened first and it is permanent
    expect(outcomeOf(rules, held, START, CAP)).toBe("trailing_drawdown");
  });

  it("should take the fees off before reading the target", () => {
    // given the target reached exactly on price, with commission charged
    const charged: Fill[] = [
      { ...fill("buy", 1, 5_000), feeCents: 50 },
      { ...fill("sell", 1, 5_600), feeCents: 50 },
    ];

    // when, then
    expect(outcomeOf(rules, ledgerOf(charged, START), START + 300_000, CAP)).toBeNull();
  });
});
