import { describe, expect, it } from "vitest";
import {
  INITIAL_STATE,
  type OrderDraft,
  type Position,
  reduceTrading,
  riskOf,
  rrRatio,
  unrealisedPnl,
} from "./trading-state";

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
  id: "p1",
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
    const risk = riskOf(long, 20_000);

    // then it is not a negative number that would flatter the risk:reward line
    expect(risk).toBeNull();
  });

  it("should price a short's risk above entry", () => {
    // given a short with its stop ten points up
    const short = draft({ side: "sell", quantity: 2, stopLoss: 20_010 });

    // when the risk is measured
    const risk = riskOf(short, 20_000);

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
    const pnl = unrealisedPnl(short, 19_980);

    // then the position is up, not down
    expect(pnl).toBe(120);
  });
});

describe("reduceTrading", () => {
  it("should leave a limit order resting rather than opening a position", () => {
    // given a limit order away from the tape
    const action = {
      kind: "submit",
      id: "o1",
      at: 1,
      last: 20_000,
      draft: draft({ type: "limit", limitPrice: 19_900 }),
    } as const;

    // when it is submitted
    const state = reduceTrading(INITIAL_STATE, action);

    // then nothing is open and the order is still working
    expect(state.positions).toHaveLength(0);
    expect(state.orders[0].status).toBe("working");
    expect(state.orders[0].price).toBe(19_900);
  });

  it("should bank the loss when a long is closed below its entry", () => {
    // given one long open at 20,000
    const open = reduceTrading(INITIAL_STATE, {
      kind: "submit",
      id: "o1",
      at: 1,
      last: 20_000,
      draft: draft({ quantity: 2 }),
    });

    // when it is closed five points lower
    const closed = reduceTrading(open, { kind: "close", id: "o1", at: 2, last: 19_995 });

    // then the realised total carries the sign, and nothing is left open
    expect(closed.realised).toBe(-20);
    expect(closed.positions).toHaveLength(0);
  });
});
