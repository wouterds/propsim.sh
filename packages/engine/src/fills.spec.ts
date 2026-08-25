import { describe, expect, it } from "vitest";
import { balanceOf, type Fill, ledgerOf, peakOf, positionsOf, type Side } from "./fills";
import { priceUnits } from "./money";

const START = 5_000_000;

let minute = 0;

const fill = (side: Side, quantity: number, price: number): Fill => {
  minute += 1;

  return {
    instrument: "MNQ",
    side,
    quantity,
    price: priceUnits(price),
    at: new Date(Date.UTC(2026, 7, 25, 14, minute)),
    tradeDate: "2026-08-25",
  };
};

describe("ledgerOf", () => {
  it("should bank a profit when a short is covered lower", () => {
    // given three micro Nasdaq sold and bought back twenty points down
    const fills = [fill("sell", 3, 20_000), fill("buy", 3, 19_980)];

    // when the stream is folded
    const ledger = ledgerOf(fills, START);

    // then the sign follows the side held, not the side of the closing fill
    expect(ledger.realisedCents).toBe(12_000);
    expect(positionsOf(ledger)).toEqual([]);
  });

  it("should measure a close against the lot it closed, not a rolling average", () => {
    // given two longs at different prices and a sale between them
    const fills = [fill("buy", 1, 20_000), fill("buy", 1, 20_100), fill("sell", 1, 20_050)];

    // when the stream is folded
    const ledger = ledgerOf(fills, START);

    // then the first lot is the one that closed, at fifty points of profit
    expect(ledger.realisedCents).toBe(10_000);
    expect(ledger.trips).toHaveLength(1);
    expect(ledger.trips[0].entry).toBe(priceUnits(20_000));
  });

  it("should turn a position that is sold through flat, and open the rest the other way", () => {
    // given two short and five bought
    const fills = [fill("sell", 2, 20_000), fill("buy", 5, 19_990)];

    // when the stream is folded
    const ledger = ledgerOf(fills, START);

    // then two closed for ten points each and three are left long at the new price
    expect(ledger.realisedCents).toBe(4_000);
    expect(positionsOf(ledger)).toEqual([
      {
        instrument: "MNQ",
        side: "buy",
        quantity: 3,
        entry: priceUnits(19_990),
        openedAt: fills[1].at,
      },
    ]);
  });

  it("should raise the peak on an open position that is up, and not lower it after", () => {
    // given a long that is a hundred points up when the next fill prints, then given back
    const fills = [fill("buy", 1, 20_000), fill("buy", 1, 20_100), fill("sell", 2, 19_900)];

    // when the stream is folded
    const ledger = ledgerOf(fills, START);

    // then the peak counted the unrealised high and the balance carries the loss
    expect(peakOf(ledger)).toBe(5_020_000);
    expect(balanceOf(ledger)).toBe(4_940_000);
  });

  it("should keep the opening balance as the peak of an account that only lost", () => {
    // given a single losing round trip
    const fills = [fill("buy", 1, 20_000), fill("sell", 1, 19_900)];

    // then
    expect(peakOf(ledgerOf(fills, START))).toBe(START);
  });
});
