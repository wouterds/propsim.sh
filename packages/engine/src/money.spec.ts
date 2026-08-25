import { describe, expect, it } from "vitest";
import { priceUnits, valueOfMove } from "./money";

describe("priceUnits", () => {
  it("should hold a tick that a float cannot", () => {
    // given a copper price on the 0.0005 grid, which has no exact float
    // when it is taken into price units
    // then the trailing unit is not lost to truncation
    expect(priceUnits(1.0005)).toBe(1_000_500);
  });
});

describe("valueOfMove", () => {
  it("should value the finest tick in the list as a whole number of cents", () => {
    // given one micro copper, whose tick is 0.0005 at 25,000 dollars a point
    // when the price moves one tick
    const value = valueOfMove(500, 1, 2_500_000);

    // then it is $12.50, to the cent
    expect(value).toBe(1_250);
  });

  it("should carry the sign of an adverse move", () => {
    // given two micro Nasdaq contracts, four points against
    // when the move is valued
    // then the loss is negative, at two dollars a point
    expect(valueOfMove(-4_000_000, 2, 200)).toBe(-1_600);
  });
});
