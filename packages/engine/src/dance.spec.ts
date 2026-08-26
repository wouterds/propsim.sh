import { describe, expect, it } from "vitest";
import { type Printed, STEPS, settledOf, shownOf, stepsOf } from "./dance";
import { matchesOf, type Resting } from "./matching";
import { priceUnits } from "./money";

const MINUTE = 60_000;
const TICK = 0.25;
const OPEN = Date.parse("2026-08-25T14:30:00.000Z");

const printed = (minute: number, open: number, high: number, low: number, close: number) => ({
  time: OPEN + minute * MINUTE,
  open,
  high,
  low,
  close,
});

const UP = printed(0, 100, 104, 98, 103);
const DOWN = printed(1, 103, 105, 99, 100);

const resting = (order: Partial<Resting> & Pick<Resting, "id" | "side" | "type">): Resting => ({
  intent: "trade",
  price: priceUnits(100),
  placedAt: new Date(OPEN),
  parentOrderId: null,
  parentFilledAt: null,
  ...order,
});

const highest = (steps: Printed[]) => Math.max(...steps.map((step) => step.high));
const lowest = (steps: Printed[]) => Math.min(...steps.map((step) => step.low));

describe("stepsOf", () => {
  it("should never show a price the bar did not print", () => {
    // given a wick on both sides of an up bar and of a down one

    // when each is cut into steps
    for (const bar of [UP, DOWN]) {
      const steps = stepsOf(bar, TICK);

      // then every step sits inside the bar's own range
      expect(steps).toHaveLength(STEPS);
      expect(highest(steps)).toBeLessThanOrEqual(bar.high);
      expect(lowest(steps)).toBeGreaterThanOrEqual(bar.low);
    }
  });

  it("should reach both of the bar's extremes", () => {
    // given the same bar, and one that closed lower than it opened

    // when both are cut into steps
    const up = stepsOf(UP, TICK);
    const down = stepsOf(DOWN, TICK);

    // then the path prints the bar's own high and low, or an order the tape
    // reached would never fill
    expect(highest(up)).toBe(UP.high);
    expect(lowest(up)).toBe(UP.low);
    expect(highest(down)).toBe(DOWN.high);
    expect(lowest(down)).toBe(DOWN.low);
  });

  it("should keep every step on the contract's tick grid", () => {
    // given a contract whose price moves in quarters

    // when a bar is cut into steps
    const steps = stepsOf(UP, TICK);

    // then no step names a price that could not have traded
    for (const step of steps) {
      expect(step.close % TICK).toBe(0);
      expect(step.open % TICK).toBe(0);
    }
  });

  it("should start on the bar's open and finish on its close", () => {
    // given the same two bars

    // when they are cut into steps
    const up = stepsOf(UP, TICK);
    const down = stepsOf(DOWN, TICK);

    // then the danced candle settles as the bar it came from
    expect(up[0].open).toBe(UP.open);
    expect(up.at(-1)?.close).toBe(UP.close);
    expect(down[0].open).toBe(DOWN.open);
    expect(down.at(-1)?.close).toBe(DOWN.close);
  });

  it("should lay the steps end to end across the bar's own minute", () => {
    // given a bar

    // when it is cut into steps
    const steps = stepsOf(UP, TICK);

    // then the steps tile the minute, so a fill decided on one is stamped
    // inside the bar it was decided on
    expect(steps.map((step) => step.time - UP.time)).toEqual([
      0, 5_000, 10_000, 15_000, 20_000, 25_000, 30_000, 35_000, 40_000, 45_000, 50_000, 55_000,
    ]);
  });

  it("should give the same path every time it is asked", () => {
    // given a bar read twice, as a reload and a restart both do

    // when it is cut into steps twice
    const first = stepsOf(UP, TICK);
    const second = stepsOf(UP, TICK);

    // then nothing about the dance depends on when it was asked for
    expect(second).toEqual(first);
  });

  it("should give two different bars two different paths", () => {
    // given two bars with the same range on different minutes
    const later = { ...UP, time: UP.time + 30 * MINUTE };

    // when both are cut into steps
    const steps = stepsOf(later, TICK).map((step) => step.close);

    // then the path is seeded on the bar, not shared by every bar
    expect(steps).not.toEqual(stepsOf(UP, TICK).map((step) => step.close));
  });
});

describe("shownOf", () => {
  it("should show more of the bar as the feed's clock runs on", () => {
    // given the bar that has just become the newest one
    const closed = UP.time + MINUTE;

    // when the feed's clock runs through the minute after it
    const first = shownOf(UP, closed, TICK);
    const half = shownOf(UP, closed + MINUTE / 2, TICK);
    const whole = shownOf(UP, closed + MINUTE, TICK);

    // then the reveal only ever grows, and each is a prefix of the last
    expect(first).toHaveLength(1);
    expect(half).toHaveLength(STEPS / 2);
    expect(whole).toHaveLength(STEPS);
    expect(whole.slice(0, half.length)).toEqual(half);
    expect(half.slice(0, first.length)).toEqual(first);
  });

  it("should finish the candle and then hold it still when the tape stops", () => {
    // given a feed that stalled, or a market that shut, hours ago
    const stalled = UP.time + 6 * 60 * MINUTE;

    // when the bar is read against a clock that has run past it
    const shown = shownOf(UP, stalled, TICK);

    // then the candle is complete and no further, rather than dancing forever
    expect(shown).toEqual(stepsOf(UP, TICK));
  });
});

describe("settledOf", () => {
  it("should refuse every step of the bar that is still dancing", () => {
    // given two bars, the newer of which has only just closed
    const at = DOWN.time + MINUTE;

    // when the matcher asks what it may read
    const settled = settledOf([UP, DOWN], at, TICK);

    // then it is given the bar the trader has been shown in full, and no part
    // of the one still being revealed
    expect(settled).toEqual(stepsOf(UP, TICK));
  });

  it("should hand over a bar exactly when the trader has seen all of it", () => {
    // given the moment before the bar after it closes, and the moment after
    const before = UP.time + MINUTE + MINUTE - 5_001;
    const after = UP.time + 2 * MINUTE;

    // when the matcher asks at each
    const early = settledOf([UP], before, TICK);
    const ready = settledOf([UP], after, TICK);

    // then nothing is offered while a step is still unseen
    expect(shownOf(UP, before, TICK).length).toBeLessThan(STEPS);
    expect(early).toEqual([]);
    expect(ready).toEqual(stepsOf(UP, TICK));
  });

  it("should offer only prices the trader was shown", () => {
    // given a settled bar
    const settled = settledOf([UP, DOWN], DOWN.time + 2 * MINUTE, TICK);
    const shown = [
      ...shownOf(UP, DOWN.time + 2 * MINUTE, TICK),
      ...shownOf(DOWN, DOWN.time + 2 * MINUTE, TICK),
    ];

    // then what the matcher reads is exactly what the chart drew
    expect(settled).toEqual(shown);
  });
});

describe("an order placed part way through a bar", () => {
  it("should fill on a later step of the same bar, in both directions", () => {
    // given a trader watching the fifth step of a bar go by
    const steps = stepsOf(UP, TICK);
    const watched = steps[4];
    const coming = steps.slice(5);
    const placedAt = new Date(watched.time);

    // when they rest an order at the far end of what the dance has still to do
    const up = resting({
      id: "up",
      side: "buy",
      type: "stop",
      price: priceUnits(highest(coming)),
      placedAt,
    });
    const down = resting({
      id: "down",
      side: "sell",
      type: "stop",
      price: priceUnits(lowest(coming)),
      placedAt,
    });
    const matches = matchesOf([up, down], steps);

    // then both fill, inside the minute they were placed in
    expect(matches.map((match) => match.order.id).sort()).toEqual(["down", "up"]);

    for (const match of matches) {
      expect(match.at.getTime()).toBeGreaterThanOrEqual(watched.time);
      expect(match.at.getTime()).toBeLessThan(UP.time + MINUTE);
    }
  });

  it("should never fill on a whole bar, which is the bug the steps exist for", () => {
    // given the same order, and the plain one minute bar it was placed inside
    const steps = stepsOf(UP, TICK);
    const order = resting({
      id: "up",
      side: "buy",
      type: "stop",
      price: priceUnits(highest(steps.slice(5))),
      placedAt: new Date(steps[4].time),
    });

    // when the whole bar is matched instead of its steps
    const matches = matchesOf([order], [UP]);

    // then the bar opened before the order was placed and can never reach it
    expect(matches).toEqual([]);
  });

  it("should leave an order the rest of the dance never reaches resting", () => {
    // given a buy stop a tick above everything the bar printed
    const steps = stepsOf(UP, TICK);
    const order = resting({
      id: "up",
      side: "buy",
      type: "stop",
      price: priceUnits(UP.high) + 1,
      placedAt: new Date(steps[4].time),
    });

    // when the steps are matched
    const matches = matchesOf([order], steps);

    // then the dance does not invent a price to reach it
    expect(matches).toEqual([]);
  });
});
