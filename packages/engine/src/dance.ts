import type { Bar } from "./matching";

/**
 * A bar and where it closed. The matcher never reads a close; the path through
 * a bar has to end on one.
 */
export type Printed = Bar & { close: number };

/** The finest bar the tape publishes, and the only one that is ever danced. */
const MINUTE = 60_000;

/** One step per push of the live feed, so a step is never drawn half way. */
export const STEPS = 12;

/** How far price moves in one step, as a share of the bar's own range. */
const WANDER = 0.3;

/**
 * Seeded on the bar itself, so the same bar always dances the same way on every
 * process and after every restart. A path anyone can read off the shape of the
 * candle is a free trade: a first leg that always runs against the close tells
 * the trader the colour of the bar five seconds in.
 */
const noiseOf = (seed: number) => {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;

    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;

    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
  };
};

const seedOf = (bar: Printed) =>
  Math.abs(Math.round(bar.time / 1000 + (bar.open + bar.high + bar.low + bar.close) * 1000));

/** Price at every step boundary, from the bar's open to its close. */
const pathOf = (bar: Printed, tick: number) => {
  const next = noiseOf(seedOf(bar));
  const range = bar.high - bar.low;
  const path = [bar.open];

  for (let step = 1; step < STEPS; step++) {
    const drift = (next() * 2 - 1) * range * WANDER;

    // On the contract's own grid. A price off the grid could not have traded,
    // whatever range it sits in.
    const moved = Math.round((path[step - 1] + drift) / tick) * tick;

    path.push(Math.min(bar.high, Math.max(bar.low, moved)));
  }

  path.push(bar.close);

  // The bar's own extremes have to print somewhere inside it, or the dance
  // draws a narrower bar than the one it came from and an order the tape
  // reached is never filled. They are stretched out of the two steps already
  // furthest that way, so the path turns rather than spikes.
  let low = 1;
  let high = 1;

  for (let step = 2; step < STEPS; step++) {
    low = path[step] < path[low] ? step : low;
    high = path[step] > path[high] ? step : high;
  }

  path[low] = bar.low;
  path[high === low ? high + 1 : high] = bar.high;

  return path;
};

/**
 * The bar cut into the steps it is shown in, oldest first. Same bar and tick in,
 * same steps out, so the chart and the matcher read one path and not two.
 *
 * Every step lies inside the bar's own range, on the contract's tick grid, and
 * the steps together reach both extremes, so no price here is one the minute
 * did not print.
 */
export const stepsOf = (bar: Printed, tick: number): Printed[] => {
  const path = pathOf(bar, tick);
  const span = MINUTE / STEPS;

  return path.slice(0, -1).map((open, step) => ({
    time: bar.time + step * span,
    open,
    high: Math.max(open, path[step + 1]),
    low: Math.min(open, path[step + 1]),
    close: path[step + 1],
  }));
};

/**
 * The steps of this bar the tape has shown by `at`, which is the feed's own
 * clock. The bar after it is the clock the dance runs on: a bar is shown in
 * full exactly when its successor closes, which is exactly when the feed
 * publishes that successor and this bar stops being the newest one.
 *
 * A feed that stopped, or a market that shut, leaves `at` where it was. The
 * candle finishes and then holds still, which is what happened.
 */
export const shownOf = (bar: Printed, at: number, tick: number): Printed[] => {
  const ran = (at - (bar.time + MINUTE)) / MINUTE;
  const shown = Math.min(STEPS, Math.max(1, Math.ceil(ran * STEPS)));

  return stepsOf(bar, tick).slice(0, shown);
};

/**
 * Every step of every bar the tape has finished showing, oldest first.
 */
export const settledOf = (bars: Printed[], at: number, tick: number): Printed[] =>
  bars.flatMap((bar) => {
    const steps = shownOf(bar, at, tick);

    return steps.length === STEPS ? steps : [];
  });

/**
 * How far behind the screen a fill is decided, so one is never decided on a step
 * the trader has not been drawn. Three steps covers the longest a cached answer
 * is held, which is the only way the two readings can drift apart.
 */
export const MATCH_MARGIN_MS = 3 * (MINUTE / STEPS);

/**
 * Every step the trader has been shown, the bar still being revealed included,
 * held back by the margin. This is what the matcher and the floor sweep read.
 *
 * Waiting for a bar to finish revealing instead puts the frontier a whole minute
 * behind the chart, and the trader watches price trade through a resting order
 * while nothing fills. That is the thing the dance was built to stop.
 */
export const revealedOf = (bars: Printed[], at: number, tick: number): Printed[] =>
  bars.flatMap((bar) => shownOf(bar, at - MATCH_MARGIN_MS, tick));
