import { describe, expect, it } from "vitest";
import { marketableAt } from "./marketable";
import { priceUnits } from "./money";

const at = (price: number) => priceUnits(price);

describe("marketableAt", () => {
  it("should leave a buy limit under the market resting", () => {
    // given a buy limit below where the tape is
    const order = { side: "buy", type: "limit", price: at(100) } as const;

    // when, then it waits for the price to come down to it
    expect(marketableAt(order, at(105))).toBeNull();
  });

  it("should take a buy limit priced over the market straight away", () => {
    // given a buy limit above where the tape is
    const order = { side: "buy", type: "limit", price: at(110) } as const;

    // when, then it fills at the mark, which is better than it asked for
    expect(marketableAt(order, at(105))).toBe(at(105));
  });

  it("should take a sell limit priced under the market straight away", () => {
    // given
    const order = { side: "sell", type: "limit", price: at(100) } as const;

    // when, then
    expect(marketableAt(order, at(105))).toBe(at(105));
    expect(marketableAt({ ...order, price: at(110) }, at(105))).toBeNull();
  });

  it("should fill a limit sitting exactly on the mark", () => {
    // given a limit at the price the tape is showing
    // when, then there is something there to take
    expect(marketableAt({ side: "buy", type: "limit", price: at(105) }, at(105))).toBe(at(105));
    expect(marketableAt({ side: "sell", type: "limit", price: at(105) }, at(105))).toBe(at(105));
  });

  it("should trigger a stop the price has already gone past", () => {
    // given a buy stop under the market and a sell stop over it
    // when, then both have already been reached
    expect(marketableAt({ side: "buy", type: "stop", price: at(100) }, at(105))).toBe(at(105));
    expect(marketableAt({ side: "sell", type: "stop", price: at(110) }, at(105))).toBe(at(105));
  });

  it("should leave a stop the price has not reached resting", () => {
    // given a buy stop over the market and a sell stop under it
    // when, then neither has triggered
    expect(marketableAt({ side: "buy", type: "stop", price: at(110) }, at(105))).toBeNull();
    expect(marketableAt({ side: "sell", type: "stop", price: at(100) }, at(105))).toBeNull();
  });

  it("should never fill worse than the level that was asked for", () => {
    // given every marketable shape
    const shapes = [
      { side: "buy", type: "limit", price: at(110) },
      { side: "sell", type: "limit", price: at(100) },
    ] as const;

    // when each is taken at the mark
    for (const order of shapes) {
      const filled = marketableAt(order, at(105));

      // then the fill is on the right side of the level
      expect(filled).not.toBeNull();
      expect(
        order.side === "buy" ? (filled ?? 0) <= order.price : (filled ?? 0) >= order.price,
      ).toBe(true);
    }
  });
});
