import { describe, expect, it } from "vitest";
import { type OrderDraft, type Position, riskOf, rrRatio, unrealisedPnl } from "./trading-state";

// The numbers below were written against the micro Nasdaq.
const POINT = 2;

const draft = (overrides: Partial<OrderDraft> = {}): OrderDraft => ({
  side: "buy",
  quantity: 1,
  type: "market",
  limitPrice: null,
  stopLoss: null,
  takeProfit: null,
  ...overrides,
});

const position = (overrides: Partial<Position> = {}): Position => ({
  id: "MNQ",
  openedAt: 0,
  side: "buy",
  quantity: 1,
  entry: 20_000,
  stopLoss: null,
  takeProfit: null,
  ...overrides,
});

describe("riskOf", () => {
  it("should refuse a stop that sits on the wrong side of entry", () => {
    // given a long whose stop is above the price it entered at
    const long = draft({ side: "buy", stopLoss: 20_010 });

    // when the risk is measured
    const risk = riskOf(long, 20_000, POINT);

    // then it is not a negative number that would flatter the risk:reward line
    expect(risk).toBeNull();
  });

  it("should price a short's risk above entry", () => {
    // given a short with its stop ten points up
    const short = draft({ side: "sell", quantity: 2, stopLoss: 20_010 });

    // when the risk is measured
    const risk = riskOf(short, 20_000, POINT);

    // then it is ten points on two contracts at two dollars a point
    expect(risk).toBe(40);
  });
});

describe("rrRatio", () => {
  it("should hand back null when there is no risk to divide by", () => {
    // given a reward with no stop behind it
    // when the ratio is taken
    // then it is null rather than Infinity
    expect(rrRatio(0, 100)).toBeNull();
    expect(rrRatio(null, 100)).toBeNull();
  });
});

describe("unrealisedPnl", () => {
  it("should count a falling price as profit on the short side", () => {
    // given a short opened at 20,000
    const short = position({ side: "sell", quantity: 3 });

    // when the tape prints twenty points lower
    const pnl = unrealisedPnl(short, 19_980, POINT);

    // then the position is up, not down
    expect(pnl).toBe(120);
  });
});
