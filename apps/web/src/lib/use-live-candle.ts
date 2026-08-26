import type { Candle } from "@propsim/datasources";
import { useEffect, useState } from "react";

/**
 * The candle the server is dancing, or null until the first one arrives. The
 * browser never polls: it holds one stream and is told when the step changes.
 */
export const useLiveCandle = (code: string, timeframe: string) => {
  const [candle, setCandle] = useState<Candle | null>(null);

  useEffect(() => {
    setCandle(null);

    const query = new URLSearchParams({ s: code, tf: timeframe });
    const source = new EventSource(`/feed?${query}`);

    source.onmessage = (event) => setCandle(JSON.parse(event.data) as Candle);

    // EventSource reconnects on its own. Closing here would stop that.
    return () => source.close();
  }, [code, timeframe]);

  return candle;
};
