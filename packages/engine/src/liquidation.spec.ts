import { describe, expect, it } from "vitest";
import { type Fill, ledgerOf, type Side } from "./fills";
import type { AccountRules } from "./floors";
import { liquidationMarksOf, lowEquityOf, markingOf } from "./liquidation";
import type { Bar } from "./matching";
import { priceUnits, toPrice } from "./money";

const START = 5_000_000;

const fill = (instrument: string, side: Side, quantity: number, price: number): Fill => ({
  instrument,
  side,
  quantity,
  price: priceUnits(price),
  at: new Date(Date.UTC(2026, 7, 26, 14)),
  tradeDate: "2026-08-26",
});

const bar = (open: number, high: number, low: number): Bar => ({ time: 0, open, high, low });

const at = (minute: number, open: number, high: number, low: number): Bar => ({
  time: Date.UTC(2026, 7, 26, 15, minute),
  open,
  high,
  low,
});

const rules: AccountRules = {
  startingBalanceCents: START,
  profitTargetCents: 300_000,
  trailingDrawdownCents: 200_000,
  dailyLossLimitCents: 10_000,
  lockAboveStartCents: 10_000,
};

const marks = { peakEquityCents: START, sessionOpenCents: START };

describe("lowEquityOf", () => {
  it("should read a long at the low of the bar and a short at the high", () => {
    // given one contract held each way, each with ten points against it
    const ledger = ledgerOf([fill("MES", "buy", 1, 5_000), fill("MNQ", "sell", 1, 20_000)], START);

    // when the bars are marked
    const low = lowEquityOf(
      ledger,
      new Map([
        ["MES", bar(5_000, 5_001, 4_990)],
        ["MNQ", bar(20_000, 20_010, 19_999)],
      ]),
    );

    // then both are taken at the end of the range that hurt, never the kind one
    expect(low).toBe(START - 5_000 - 2_000);
  });

  it("should leave a contract the bars say nothing about at its last print", () => {
    // given a position in a contract with no bar to mark it against
    const ledger = ledgerOf([fill("MES", "buy", 1, 5_000)], START);

    // then
    expect(lowEquityOf(ledger, new Map())).toBe(START);
  });
});

describe("liquidationMarksOf", () => {
  it("should flatten at the price that puts the equity exactly on the floor", () => {
    // given two micro S&P long from 5000, and a floor a hundred dollars down
    const ledger = ledgerOf([fill("MES", "buy", 2, 5_000)], START);
    const bars = new Map([["MES", bar(4_995, 4_996, 4_986)]]);

    // when the bar that broke the floor is solved
    const marks = liquidationMarksOf(ledger, bars, START - 10_000);

    // then the fill is at the trigger, not at the low the bar went on to print
    expect(toPrice(marks.get("MES") ?? 0)).toBe(4_990);
  });

  it("should flatten at the open when the bar gapped through the floor", () => {
    // given the same position and a bar that opened already past the floor
    const ledger = ledgerOf([fill("MES", "buy", 2, 5_000)], START);
    const bars = new Map([["MES", bar(4_980, 4_981, 4_975)]]);

    // when
    const marks = liquidationMarksOf(ledger, bars, START - 10_000);

    // then there was no distance to travel, so the open is where it was caught
    expect(toPrice(marks.get("MES") ?? 0)).toBe(4_980);
  });

  it("should take every open contract the same distance into its own bar", () => {
    // given two longs whose bars fall a different number of points
    const ledger = ledgerOf([fill("MES", "buy", 1, 5_000), fill("MNQ", "buy", 1, 20_000)], START);
    const bars = new Map([
      ["MES", bar(5_000, 5_001, 4_990)],
      ["MNQ", bar(20_000, 20_001, 19_900)],
    ]);

    // when a floor half of the combined fall away is solved
    // MES gives up 5000 cents over its bar, MNQ 20000, so 12500 is halfway
    const marks = liquidationMarksOf(ledger, bars, START - 12_500);

    // then neither is invented a path of its own
    expect(toPrice(marks.get("MES") ?? 0)).toBe(4_995);
    expect(toPrice(marks.get("MNQ") ?? 0)).toBe(19_950);
  });
});

describe("markingOf", () => {
  it("should flatten in the bar that broke the floor, not the worst one after it", () => {
    // given two long, and a tape that dips through the floor before falling much further
    const ledger = ledgerOf([fill("MES", "buy", 2, 5_000)], START);
    const tape = new Map([
      ["MES", [at(0, 5_000, 5_001, 4_998), at(1, 4_995, 4_996, 4_986), at(2, 4_986, 4_987, 4_900)]],
    ]);

    // when the tape is read
    const { liquidation } = markingOf(ledger, tape, rules, marks);

    // then the second bar ended it, at the price that met the floor inside it
    expect(liquidation?.breach).toBe("daily_loss");
    expect(liquidation?.at.getTime()).toBe(Date.UTC(2026, 7, 26, 15, 1));
    expect(toPrice(liquidation?.marks.get("MES") ?? 0)).toBe(4_990);
  });

  it("should report the low without a liquidation when no bar reached the floor", () => {
    // given a tape that fell nine dollars short of the daily limit
    const ledger = ledgerOf([fill("MES", "buy", 2, 5_000)], START);
    const tape = new Map([["MES", [at(0, 5_000, 5_001, 4_991)]]]);

    // when
    const { lowEquityCents, liquidation } = markingOf(ledger, tape, rules, marks);

    // then the mark is still worth storing, because the ratchet only falls
    expect(liquidation).toBeNull();
    expect(lowEquityCents).toBe(START - 9_000);
  });

  it("should hold the low at the last print when the tape says nothing", () => {
    // given an account holding a position and no bars to read
    const ledger = ledgerOf([fill("MES", "buy", 2, 5_000)], START);

    // when
    const { lowEquityCents, liquidation } = markingOf(ledger, new Map(), rules, marks);

    // then nothing is invented from an empty tape
    expect(liquidation).toBeNull();
    expect(lowEquityCents).toBe(START);
  });
});
