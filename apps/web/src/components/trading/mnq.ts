import type { Interval, Range } from "@propsim/datasources";

export const SYMBOL = "MNQ=F";

/** Micro Nasdaq: quarter-point ticks at $2 a point, so one tick is $0.50. */
export const TICK_SIZE = 0.25;
export const POINT_VALUE = 2;

export const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h"] as const satisfies readonly Interval[];

export type Timeframe = (typeof TIMEFRAMES)[number];

const DEFAULT_TIMEFRAME: Timeframe = "5m";

/**
 * Every window sits inside one contract's life and inside Yahoo's per-interval
 * reach. `MNQ=F` is a continuous front-month series that is not back-adjusted,
 * so anything from `3mo` up crosses a quarterly roll and paints the gap as a
 * real move; `1m` is additionally capped near eight days upstream.
 */
const RANGE_FOR: Record<Timeframe, Range> = {
  "1m": "1d",
  "5m": "5d",
  "15m": "1mo",
  "30m": "1mo",
  "1h": "1mo",
};

export const rangeFor = (timeframe: Timeframe) => RANGE_FOR[timeframe];

export const parseTimeframe = (value: string | null): Timeframe =>
  TIMEFRAMES.find((timeframe) => timeframe === value) ?? DEFAULT_TIMEFRAME;
