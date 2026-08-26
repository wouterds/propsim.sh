import { describe, expect, it } from "vitest";
import { type Bar, matchesOf, type Resting } from "./matching";
import { priceUnits } from "./money";

const MINUTE = 60_000;
const OPEN = new Date("2026-08-25T14:30:00.000Z");

const bar = (minute: number, open: number, high: number, low: number): Bar => ({
  time: OPEN.getTime() + minute * MINUTE,
  open,
  high,
  low,
});

const resting = (order: Partial<Resting> & Pick<Resting, "id" | "side" | "type">): Resting => ({
  intent: "trade",
  price: priceUnits(100),
  placedAt: OPEN,
  parentOrderId: null,
  parentFilledAt: null,
  ...order,
});

describe("matchesOf", () => {
  it("should leave a limit resting on a bar that only touched its price", () => {
    // given a buy limit at 100 and a bar whose low is exactly 100
    const order = resting({ id: "a", side: "buy", type: "limit" });

    // when the bar is matched
    const matches = matchesOf([order], [bar(0, 101, 102, 100)]);

    // then nothing filled, because a touch does not clear the queue in front of it
    expect(matches).toEqual([]);
  });

  it("should fill a limit on the bar that traded through its price", () => {
    // given the same order and a bar one tick lower
    const order = resting({ id: "a", side: "buy", type: "limit" });

    // when
    const matches = matchesOf([order], [bar(0, 101, 102, 99.75)]);

    // then it fills at its own price, not at the low
    expect(matches.map((match) => match.price)).toEqual([priceUnits(100)]);
  });

  it("should fill a stop where price merely touched it", () => {
    // given a buy stop at 100 and a bar whose high is exactly 100
    const order = resting({ id: "a", side: "buy", type: "stop" });

    // when
    const matches = matchesOf([order], [bar(0, 99, 100, 98)]);

    // then a trade printed at the price, which is all a stop needs
    expect(matches.map((match) => match.price)).toEqual([priceUnits(100)]);
  });

  it("should fill an order the bar gapped past at the open, not at its own price", () => {
    // given a buy stop at 100 and a buy limit at 100, on a bar that opens either side
    const stop = resting({ id: "a", side: "buy", type: "stop" });
    const limit = resting({ id: "b", side: "buy", type: "limit" });

    // when each is matched against the bar that gapped through it
    const stopped = matchesOf([stop], [bar(0, 102, 103, 101)]);
    const bought = matchesOf([limit], [bar(0, 98, 99, 97)]);

    // then the stop slipped and the limit improved, both to the open
    expect(stopped.map((match) => match.price)).toEqual([priceUnits(102)]);
    expect(bought.map((match) => match.price)).toEqual([priceUnits(98)]);
  });

  it("should refuse a bar that opened before the order was placed", () => {
    // given an order placed a second after the bar opened
    const order = resting({
      id: "a",
      side: "buy",
      type: "stop",
      placedAt: new Date(OPEN.getTime() + 1_000),
    });

    // when a bar that reaches it, and a later one that also does, are matched
    const matches = matchesOf([order], [bar(0, 99, 101, 98), bar(1, 99, 101, 98)]);

    // then only the bar it could have rested through filled it
    expect(matches.map((match) => match.at.getTime())).toEqual([bar(1, 0, 0, 0).time]);
  });

  it("should keep a bracket from filling before the entry it guards", () => {
    // given a resting entry and the stop that hangs off it, on a bar reaching both
    const entry = resting({ id: "a", side: "buy", type: "stop", price: priceUnits(100) });
    const guard = resting({
      id: "b",
      side: "sell",
      type: "stop",
      intent: "stop_loss",
      price: priceUnits(99),
      parentOrderId: "a",
    });

    // when the bar reaches 99 first and never reaches 100
    const matches = matchesOf([entry, guard], [bar(0, 99.5, 99.75, 98)]);

    // then the stop did not fill, or it would open a short nobody asked for
    expect(matches).toEqual([]);
  });

  it("should stop a position out on the same bar that opened it", () => {
    // given the same pair and a bar that reaches the entry and then the stop
    const entry = resting({ id: "a", side: "buy", type: "stop", price: priceUnits(100) });
    const guard = resting({
      id: "b",
      side: "sell",
      type: "stop",
      intent: "stop_loss",
      price: priceUnits(99),
      parentOrderId: "a",
    });

    // when
    const matches = matchesOf([entry, guard], [bar(0, 99.5, 101, 98)]);

    // then both filled, the entry first, a millisecond apart so the fold agrees
    expect(matches.map((match) => match.order.id)).toEqual(["a", "b"]);
    expect(matches[1].at.getTime() - matches[0].at.getTime()).toBe(1);
  });

  it("should take the stop rather than the target when one bar reaches both", () => {
    // given a long already open, guarded by a stop at 99 and a target at 101
    const guard = resting({
      id: "b",
      side: "sell",
      type: "stop",
      intent: "stop_loss",
      price: priceUnits(99),
      parentOrderId: "a",
      parentFilledAt: OPEN,
    });
    const target = resting({
      id: "c",
      side: "sell",
      type: "limit",
      intent: "take_profit",
      price: priceUnits(101),
      parentOrderId: "a",
      parentFilledAt: OPEN,
    });

    // when a bar swings through both
    const matches = matchesOf([target, guard], [bar(0, 100, 102, 98)]);

    // then the loss printed first and the target was spent with it
    expect(matches.map((match) => match.order.id)).toEqual(["b"]);
  });
});
