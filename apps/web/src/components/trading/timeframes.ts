import type { Interval, Range } from "@propsim/datasources";

export const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h"] as const satisfies readonly Interval[];

export type Timeframe = (typeof TIMEFRAMES)[number];

const DEFAULT_TIMEFRAME: Timeframe = "15m";

/**
 * A futures symbol is not back-adjusted, so `3mo` and up cross a quarterly roll
 * and the gap reads as a real move. Yahoo also caps `1m` near eight days.
 */
const RANGE_FOR: Record<Timeframe, Range> = {
  "1m": "1d",
  "5m": "5d",
  "15m": "1mo",
  "30m": "1mo",
  "1h": "1mo",
};

export const rangeFor = (timeframe: Timeframe) => RANGE_FOR[timeframe];

const SECONDS: Record<Timeframe, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "30m": 1800,
  "1h": 3600,
};

export const barsPerDay = (timeframe: Timeframe) => Math.round(86_400 / SECONDS[timeframe]);

export const parseTimeframe = (value: string | null): Timeframe =>
  TIMEFRAMES.find((timeframe) => timeframe === value) ?? DEFAULT_TIMEFRAME;
