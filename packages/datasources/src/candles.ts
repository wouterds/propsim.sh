import { type ChartResult, fetchChart } from "./yahoo";

export type Candle = {
  /** Bar open, in milliseconds. A bar can run short, so time plus interval is not its end. */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  /** 0 means Yahoo published no volume, not that nothing traded. */
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

/** Intraday only. A daily bar is stamped at the calendar day, not at the session open. */
export type Interval = keyof typeof SECONDS;

/** `max` is absent. Yahoo answers it with weekly rows at every interval. */
export type Range = "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "2y";

export type CandleRequest = { symbol: string; interval: Interval; range: Range };

// Also rejects NaN. A floor measured against a NaN low never breaches.
const finite = (value: number | null | undefined): value is number => Number.isFinite(value);

export const toCandles = (
  result: ChartResult,
  request: CandleRequest,
  forming = false,
): Candle[] => {
  const { symbol, interval, range } = request;
  const length = SECONDS[interval];
  const stamps = result.timestamp ?? [];
  const bars = result.indicators.quote?.[0];

  // Yahoo's clock, not Date.now(). Upstream delay makes wall-clock arithmetic
  // call a moving bar settled.
  const closed: number[] = [];

  for (let i = 0; i < stamps.length; i++) {
    if (stamps[i] + length <= result.meta.regularMarketTime) {
      closed.push(i);
    }
  }

  // Yahoo can serve coarser rows and still report the interval asked for. The
  // gaps are the only reliable signal.
  let tightest = Number.POSITIVE_INFINITY;

  for (let i = 1; i < closed.length; i++) {
    tightest = Math.min(tightest, stamps[closed[i]] - stamps[closed[i - 1]]);
  }

  if (closed.length > 1 && tightest > length) {
    throw new Error(`Yahoo served ${symbol} coarser than ${interval} over ${range}`);
  }

  // The bar still printing, for a chart that has to look alive. Never for the
  // matcher: its low can still fall, and a fill decided on it is invented.
  //
  // It has to sit a whole number of intervals after the last closed bar. Yahoo
  // appends the live quote as a row of its own, stamped at the quote time
  // rather than at a bar open, and that row is a price and not a bar.
  const wanted = [...closed];
  const settled = closed.at(-1);

  if (forming && settled !== undefined) {
    for (let i = settled + 1; i < stamps.length; i++) {
      const aligned = (stamps[i] - stamps[settled]) % length === 0;

      if (aligned && stamps[i] + length > result.meta.regularMarketTime) {
        wanted.push(i);
        break;
      }
    }
  }

  const candles: Candle[] = [];

  for (const i of wanted) {
    const open = bars?.open?.[i];
    const high = bars?.high?.[i];
    const low = bars?.low?.[i];
    const close = bars?.close?.[i];

    // Drop, never fill. A null low carried through as zero puts the floor at zero.
    if (!finite(open) || !finite(high) || !finite(low) || !finite(close)) {
      continue;
    }

    // The low is what the floor is measured against. A fabricated one breaches
    // on a price that never printed.
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

  // An empty array reads as a session with no trades and no breach.
  if (candles.length === 0) {
    throw new Error(`Yahoo served ${symbol} no closed ${interval} bar over ${range}`);
  }

  // Yahoo can answer a wide range with one bar. Only `1d` legitimately has one.
  if (candles.length < 2 && range !== "1d") {
    throw new Error(`Yahoo served ${symbol} truncated to one bar over ${range}`);
  }

  return candles;
};

/**
 * Closed bars, oldest first. Throws rather than returning an empty array.
 *
 * `MES=F` and `MNQ=F` are not back-adjusted, so a range of `3mo` or more crosses
 * a quarterly roll and the gap reads as a real move. Yahoo also caps reach per
 * interval and answers past it with a 422: `1m` near 8 days, `2m` near 38,
 * `5m` to `30m` at 60, `1h` near two years.
 */
export const getCandles = async (
  request: CandleRequest,
  options?: { forming?: boolean },
): Promise<Candle[]> => toCandles(await fetchChart(request), request, options?.forming === true);
