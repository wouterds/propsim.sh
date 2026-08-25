import type { Interval, Range } from "@propsim/datasources";

export const SYMBOL = "MNQ=F";

/** Micro Nasdaq: quarter-point ticks at $2 a point, so one tick is $0.50. */
export const TICK_SIZE = 0.25;
export const POINT_VALUE = 2;

export const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h"] as const satisfies readonly Interval[];

export type Timeframe = (typeof TIMEFRAMES)[number];

const DEFAULT_TIMEFRAME: Timeframe = "15m";

/**
 * `MNQ=F` is not back-adjusted, so `3mo` and up cross a quarterly roll and the gap
 * reads as a real move. Yahoo also caps `1m` near eight days.
 */
const RANGE_FOR: Record<Timeframe, Range> = {
  "1m": "1d",
  "5m": "5d",
  "15m": "1d",
  "30m": "1mo",
  "1h": "1mo",
};

export const rangeFor = (timeframe: Timeframe) => RANGE_FOR[timeframe];

export const parseTimeframe = (value: string | null): Timeframe =>
  TIMEFRAMES.find((timeframe) => timeframe === value) ?? DEFAULT_TIMEFRAME;
