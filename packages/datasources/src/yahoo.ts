import type { CandleRequest, Range } from "./candles";
import { shared } from "./shared";

const CHART = "https://query1.finance.yahoo.com/v8/finance/chart";

/**
 * Without a user agent Yahoo answers 429 with an empty result, which reads like
 * an unlisted symbol. The rate limit buckets per agent string, so a common
 * browser string shares a bucket every other tool has already spent.
 */
const AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)";

const TIMEOUT = 10_000;

/**
 * How long one answer serves everybody. The feed's own time comes back with the
 * bars and is the clock the dance runs on, so a longer hold moves the newest
 * candle in jumps of several steps instead of one.
 *
 * Only the live day is asked for that often. A wider range is read by the sweep
 * once a minute and by a chart that is not being danced, and holding those for
 * five seconds would treble the upstream rate for nobody.
 */
const FRESH_SECONDS = 15;
const DANCING_FRESH_SECONDS = 5;

const freshFor = (range: Range) => (range === "1d" ? DANCING_FRESH_SECONDS : FRESH_SECONDS);

export type ChartResult = {
  meta: { regularMarketTime: number };
  timestamp?: number[];
  indicators: {
    quote?: {
      open?: (number | null)[];
      high?: (number | null)[];
      low?: (number | null)[];
      close?: (number | null)[];
      volume?: (number | null)[];
    }[];
  };
};

type ChartPayload = {
  chart: { result?: ChartResult[]; error?: { description?: string } | null };
};

const load = async (request: CandleRequest): Promise<ChartResult> => {
  const { symbol, interval, range } = request;
  const url = `${CHART}/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
  const response = await fetch(url, {
    headers: { "User-Agent": AGENT },
    signal: AbortSignal.timeout(TIMEOUT),
  });

  // A blocked response is HTML. Without this the parse reports a syntax error
  // instead of the status.
  if (!response.ok) {
    throw new Error(`Yahoo responded ${response.status} for ${symbol}`);
  }

  const payload = (await response.json()) as ChartPayload;
  const result = payload.chart.result?.[0];

  // An unlisted symbol arrives as a 200 with the result nulled and the reason
  // in the envelope.
  if (!result) {
    const reason = payload.chart.error?.description ?? "no result";

    throw new Error(`Yahoo lists no ${symbol}: ${reason}`);
  }

  return result;
};

/**
 * One request per contract and shape, whoever asks. A hundred terminals on one
 * chart and the matcher behind them all read the same answer.
 */
export const fetchChart = (request: CandleRequest) =>
  shared(
    `chart:${request.symbol}:${request.interval}:${request.range}`,
    freshFor(request.range),
    () => load(request),
  );
