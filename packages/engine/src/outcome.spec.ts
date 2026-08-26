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

let minute = 0;

const fill = (side: Side, quantity: number, price: number): Fill => ({
  instrument: "MES",
  side,
  quantity,
  price: priceUnits(price),
  feeCents: 0,
  at: new Date(Date.UTC(2026, 7, 26, 14, minute++)),
  tradeDate: "2026-08-26",
});

/** MES is five dollars a point, so a point on one contract is 500 cents. */
const ledger = (fills: Fill[]) => ledgerOf(fills, START);

describe("outcomeOf", () => {
  it("should leave an account that has done nothing alone", () => {
    // given
    const held = ledger([]);

    // when, then
    expect(outcomeOf(rules, held, START)).toBeNull();
  });

  it("should end an account whose open loss reached the floor", () => {
    // given four hundred points against one contract, which is 2,000 dollars
    const held = ledger([fill("buy", 1, 5_000), fill("sell", 0, 5_000)]);
    const open = ledger([fill("buy", 1, 5_000)]);

    // when the mark is four hundred points below the entry
    open.marks.set("MES", priceUnits(4_600));

    // then the account is gone without anything being realised
    expect(outcomeOf(rules, open, START)).toBe("trailing_drawdown");
    expect(outcomeOf(rules, held, START)).toBeNull();
  });

  it("should leave a cent above the floor alone", () => {
    // given a loss one tick short of the drawdown
    const open = ledger([fill("buy", 1, 5_000)]);

    open.marks.set("MES", priceUnits(4_600.25));

    // when, then
    expect(outcomeOf(rules, open, START)).toBeNull();
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
    expect(outcomeOf(rules, held, START)).toBe("trailing_drawdown");
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
    expect(outcomeOf(rules, held, START)).not.toBe("trailing_drawdown");
  });

  it("should pass an account that banked the target", () => {
    // given six hundred points banked, which is 3,000 dollars
    const held = ledger([fill("buy", 1, 5_000), fill("sell", 1, 5_600)]);

    // when, then
    expect(outcomeOf(rules, held, START + 300_000)).toBe("target_met");
  });

  it("should not pass an account whose target is only floating", () => {
    // given the same profit, still open
    const open = ledger([fill("buy", 1, 5_000)]);

    open.marks.set("MES", priceUnits(5_600));

    // when the position has not been closed
    // then the money has not been made
    expect(outcomeOf(rules, open, START + 300_000)).toBeNull();
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
    expect(outcomeOf(rules, held, START)).toBe("trailing_drawdown");
  });

  it("should take the fees off before reading the target", () => {
    // given the target reached exactly on price, with commission charged
    const charged: Fill[] = [
      { ...fill("buy", 1, 5_000), feeCents: 50 },
      { ...fill("sell", 1, 5_600), feeCents: 50 },
    ];

    // when, then
    expect(outcomeOf(rules, ledgerOf(charged, START), START + 300_000)).toBeNull();
  });
});
