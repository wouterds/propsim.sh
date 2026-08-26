import { type Candle, getTape } from "@propsim/datasources";
import { type Instrument, type Printed, STEPS, shownOf } from "@propsim/engine";
import { rangeFor, spanOf, type Timeframe } from "~/components/trading/timeframes";

/** The steps shown so far, drawn as the one candle they came out of. */
const dancedOf = (bar: Candle, steps: Printed[]): Candle => ({
  ...bar,
  high: Math.max(bar.open, ...steps.map((step) => step.high)),
  low: Math.min(bar.open, ...steps.map((step) => step.low)),
  close: steps.at(-1)?.close ?? bar.open,
  volume: Math.round((bar.volume * steps.length) / STEPS),
});

/** Minutes folded onto the grid the closed bars of the timeframe already sit on. */
const bucketedOf = (bars: Candle[], from: number, span: number): Candle[] => {
  const buckets = new Map<number, Candle>();

  for (const bar of bars) {
    const start = from + span * Math.floor((bar.time - from) / span);
    const held = buckets.get(start);

    if (!held) {
      buckets.set(start, { ...bar, time: start });
      continue;
    }

    held.high = Math.max(held.high, bar.high);
    held.low = Math.min(held.low, bar.low);
    held.close = bar.close;
    held.volume += bar.volume;
  }

  return [...buckets.values()];
};

/**
 * The chart, and the step of the dance it ends on. Everything the feed has
 * printed since that step is held back, so the newest candle is the only one
 * still moving and it only ever shows a price the trader has been given.
 *
 * The one place either is read. A screen and a fill that came from two readings
 * of the tape are two different tapes.
 */
export const tapeOf = async (instrument: Instrument, timeframe: Timeframe) => {
  const { symbol } = instrument;
  const [coarse, minutes] = await Promise.all([
    getTape({ symbol, interval: timeframe, range: rangeFor(timeframe) }),
    getTape({ symbol, interval: "1m", range: "1d" }),
  ]);

  const dancing = minutes.candles.at(-1);

  if (!dancing) {
    throw new Error(`${symbol} has no closed minute to dance`);
  }

  const steps = shownOf(dancing, minutes.at, instrument.tick);
  const span = spanOf(timeframe);

  // A coarse bar that runs into the minute being danced carries the steps the
  // trader has not been given, so it is rebuilt out of the minutes instead.
  const settled = coarse.candles.filter((bar) => bar.time + span <= dancing.time);
  const last = settled.at(-1);
  const from = last ? last.time + span : dancing.time;
  const since = minutes.candles.filter((bar) => bar.time >= from && bar.time < dancing.time);
  const newest = bucketedOf([...since, dancedOf(dancing, steps)], from, span);

  return { candles: [...settled, ...newest], step: steps.at(-1) };
};
