import { describe, expect, it } from "vitest";
import {
  balanceOf,
  carriedInOf,
  type Fill,
  ledgerOf,
  peakOf,
  positionsOf,
  type Side,
} from "./fills";
import { priceUnits } from "./money";

const START = 5_000_000;

let minute = 0;

const fill = (side: Side, quantity: number, price: number, feeCents = 0): Fill => {
  minute += 1;

  return {
    instrument: "MNQ",
    side,
    quantity,
    price: priceUnits(price),
    feeCents,
    at: new Date(Date.UTC(2026, 7, 25, 14, minute)),
    tradeDate: "2026-08-25",
  };
};

const dated = (tradeDate: string, side: Side, quantity: number, price: number): Fill => ({
  ...fill(side, quantity, price),
  tradeDate,
});

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

describe("carriedInOf", () => {
  it("should open on the starting balance when nothing printed before the session", () => {
    // given a stream whose every print belongs to the session being asked about
    const ledger = ledgerOf([dated("2026-08-26", "buy", 1, 20_000)], START);

    // then
    expect(carriedInOf(ledger, "2026-08-26")).toBe(START);
  });

  it("should open where the previous session left the equity, not where it stands now", () => {
    // given a session that banked twenty points and a later one that gave forty back
    const ledger = ledgerOf(
      [
        dated("2026-08-25", "buy", 1, 20_000),
        dated("2026-08-25", "sell", 1, 20_010),
        dated("2026-08-26", "buy", 1, 20_010),
        dated("2026-08-26", "sell", 1, 19_990),
      ],
      START,
    );

    // then the anchor is where the earlier session closed, not the latest point
    expect(carriedInOf(ledger, "2026-08-26")).toBe(START + 2_000);
    expect(balanceOf(ledger)).toBe(START - 2_000);
  });
});

describe("commission", () => {
  it("should take the balance below the starting one on a trade that broke even", () => {
    // given a round trip closed at the price it opened at, both sides charged
    const fills = [fill("buy", 2, 20_000, 100), fill("sell", 2, 20_000, 100)];

    // when
    const ledger = ledgerOf(fills, START);

    // then the movement is nothing and the account is still down what it paid
    expect(ledger.realisedCents).toBe(0);
    expect(ledger.feesCents).toBe(200);
    expect(balanceOf(ledger)).toBe(START - 200);
  });

  it("should charge a fill that opened nothing back, the same as one that closed", () => {
    // given a position opened and left open
    const ledger = ledgerOf([fill("buy", 1, 20_000, 50)], START);

    // then commission is per side, so it lands before anything is realised
    expect(balanceOf(ledger)).toBe(START - 50);
  });

  it("should take the fee off the equity path, so a floor reads it", () => {
    // given one charged fill
    const ledger = ledgerOf([fill("buy", 1, 20_000, 50)], START);

    // then a path that ignored it would leave both floors measuring an account
    // richer than it is, and the peak higher than it ever reached
    expect(ledger.path.at(-1)?.equityCents).toBe(START - 50);
    expect(peakOf(ledger)).toBe(START);
  });

  it("should split a fee across a close that only took part of a lot", () => {
    // given four bought for 200 and two sold for 100
    const fills = [fill("buy", 4, 20_000, 200), fill("sell", 2, 20_010, 100)];

    // when
    const ledger = ledgerOf(fills, START);

    // then the trip carries the two contracts it closed on each side, not all
    // four of the entry, and the rest stays with the lot still open
    expect(ledger.trips[0]?.feeCents).toBe(200);
    expect(ledger.feesCents).toBe(300);
  });

  it("should carry each lot's own rate through a first in, first out close", () => {
    // given two entries charged differently and one sale covering both
    const fills = [
      fill("buy", 1, 20_000, 50),
      fill("buy", 1, 20_100, 160),
      fill("sell", 2, 20_050, 100),
    ];

    // when
    const ledger = ledgerOf(fills, START);

    // then the cheap lot closes first and takes its own entry fee with it
    expect(ledger.trips[0]?.feeCents).toBe(100);
    expect(ledger.trips[1]?.feeCents).toBe(210);
  });
});
