import { type ChartResult, fetchChart } from "./yahoo";

export type Candle = {
  /**
   * The bar's OPEN, in milliseconds since epoch. A bar spans at most its
   * interval and sometimes less - a CME half-session emits a 30m bar at the seam
   * of a `1h` series - so `time + interval` is not the bar's end.
   */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  /** 0 means Yahoo published no volume for the bar, not that nothing traded. */
  volume: number;
};

const SECONDS = {
  "1m": 60,
  "2m": 120,
  "5m": 300,
  "15m": 900,
  "30m": 1800,
  "1h": 3600,
} as const;

/**
 * Intraday only. Yahoo stamps a daily futures bar at the calendar day while the
 * session it covers opened six hours earlier, so the stamp is a label rather
 * than an open and no fixed length recovers the window it really spans.
 */
export type Interval = keyof typeof SECONDS;

/** `max` is absent: asked for it, Yahoo answers weekly rows at every interval. */
export type Range = "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "2y";

export type CandleRequest = { symbol: string; interval: Interval; range: Range };

// Not a `typeof` check: this additionally rejects a NaN, and a drawdown floor
// measured against a NaN low silently never breaches.
const finite = (value: number | null | undefined): value is number => Number.isFinite(value);

export const toCandles = (result: ChartResult, request: CandleRequest): Candle[] => {
  const { symbol, interval, range } = request;
  const length = SECONDS[interval];
  const stamps = result.timestamp ?? [];
  const bars = result.indicators.quote?.[0];

  // Judged against Yahoo's own clock rather than `Date.now()`: under upstream
  // delay the still-moving bar is stamped far enough back that wall-clock
  // arithmetic calls it settled, and the same session then reads two ways.
  const closed: number[] = [];

  for (let i = 0; i < stamps.length; i++) {
    if (stamps[i] + length <= result.meta.regularMarketTime) {
      closed.push(i);
    }
  }

  // Yahoo answers past its intraday reach with daily or weekly rows and reports
  // the downgrade nowhere trustworthy, so it is read off the stamps: only a
  // series whose every gap exceeds the interval is genuinely coarser than it.
  let tightest = Number.POSITIVE_INFINITY;

  for (let i = 1; i < closed.length; i++) {
    tightest = Math.min(tightest, stamps[closed[i]] - stamps[closed[i - 1]]);
  }

  if (closed.length > 1 && tightest > length) {
    throw new Error(`Yahoo served ${symbol} coarser than ${interval} over ${range}`);
  }

  const candles: Candle[] = [];

  for (const i of closed) {
    const open = bars?.open?.[i];
    const high = bars?.high?.[i];
    const low = bars?.low?.[i];
    const close = bars?.close?.[i];

    // Yahoo pads every array out to the timestamps and leaves nulls where
    // nothing traded, so a bar with one in it is dropped rather than filled:
    // carried through as a zero, the low puts a drawdown floor at zero.
    if (!finite(open) || !finite(high) || !finite(low) || !finite(close)) {
      continue;
    }

    // A wick that does not contain its own body is the expensive defect rather
    // than a cosmetic one: the low is the exact number a drawdown floor is
    // measured against, so a fabricated one breaches on a price never printed.
    if (low > Math.min(open, close) || high < Math.max(open, close)) {
      continue;
    }

    candles.push({
      time: stamps[i] * 1000,
      open,
      high,
      low,
      close,
      volume: bars?.volume?.[i] ?? 0,
    });
  }

  // Raised rather than returned empty: handed back as `[]` the simulator replays
  // a session that takes no trades, breaches no floor and reports a clean pass.
  if (candles.length === 0) {
    throw new Error(`Yahoo served ${symbol} no closed ${interval} bar over ${range}`);
  }

  // Yahoo intermittently answers a wide request with one bar - the right last
  // price and no history behind it - which is not zero bars and so slips the
  // guard above. A one-day window is the one request a single bar answers.
  if (candles.length < 2 && range !== "1d") {
    throw new Error(`Yahoo served ${symbol} truncated to one bar over ${range}`);
  }

  return candles;
};

/**
 * Closed bars for a Yahoo symbol, oldest first. Raises rather than handing back
 * an empty array.
 *
 * **`MES=F` and `MNQ=F` are continuous front-month series and are not
 * back-adjusted**, so the price gaps at every quarterly roll and a drawdown
 * floor reads that jump as a real excursion, breaching an account that never
 * traded through it. Keep a window inside one contract's life: anything from
 * `3mo` up spans at least one roll.
 *
 * Reach is capped per interval, not by the range asked for, and Yahoo refuses
 * past its own cap with a 422: `1m` past about 8 days, `2m` near 38, `5m`
 * through `30m` at 60, `1h` at about two years.
 */
export const getCandles = async (request: CandleRequest): Promise<Candle[]> =>
  toCandles(await fetchChart(request), request);
