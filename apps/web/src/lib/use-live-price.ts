import { useEffect, useState } from "react";

/**
 * The last price the server pushed, or null until the first one arrives. The
 * browser never polls: it holds one stream and is told when the tape moves.
 */
export const useLivePrice = (code: string) => {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    setPrice(null);

    const source = new EventSource(`/feed?s=${encodeURIComponent(code)}`);

    source.onmessage = (event) => {
      const { price: next } = JSON.parse(event.data) as { price: number };

      setPrice(next);
    };

    // EventSource reconnects on its own. Closing here would stop that.
    return () => source.close();
  }, [code]);

  return price;
};
