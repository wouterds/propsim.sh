import type { CandleRequest } from "./candles";

const CHART = "https://query1.finance.yahoo.com/v8/finance/chart";

/**
 * A request carrying no user agent comes back 429 with an empty result, which
 * reads exactly like a symbol Yahoo does not list.
 *
 * **The allowance is bucketed per user agent as well as per address, so this
 * string is not cosmetic and lengthening it is not an improvement.** A fuller
 * Chrome string is measurably worse rather than better, because that bucket is
 * the one every other tool on the machine has already spent.
 */
const AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)";

const TIMEOUT = 10_000;

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

export const fetchChart = async (request: CandleRequest): Promise<ChartResult> => {
  const { symbol, interval, range } = request;
  const url = `${CHART}/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
  const response = await fetch(url, {
    headers: { "User-Agent": AGENT },
    signal: AbortSignal.timeout(TIMEOUT),
  });

  // A rate-limited or blocked response is HTML, so without this it falls through
  // to the parse and reports a syntax error instead of the status that came back.
  if (!response.ok) {
    throw new Error(`Yahoo responded ${response.status} for ${symbol}`);
  }

  const payload = (await response.json()) as ChartPayload;
  const result = payload.chart.result?.[0];

  // A delisted or misspelled contract arrives as a 200 with the result nulled
  // and the reason in the envelope, so an optimistic unwrap turns an expired
  // symbol into a quiet empty market. Yahoo's own words cost two lines and turn
  // a generic message into the actual diagnosis.
  if (!result) {
    const reason = payload.chart.error?.description ?? "no result";

    throw new Error(`Yahoo lists no ${symbol}: ${reason}`);
  }

  return result;
};
