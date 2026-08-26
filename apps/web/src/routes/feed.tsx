import { instrumentOr } from "@propsim/engine";
import { parseTimeframe } from "~/components/trading/timeframes";
import { requireUserId } from "~/lib/auth.server";
import { tapeOf } from "~/lib/tape.server";
import type { Route } from "./+types/feed";

/** Often enough to feel continuous, and never an upstream request of its own. */
const TICK = 5_000;

/** Proxies drop a quiet stream. A comment is not an event, so nothing reads it. */
const HEARTBEAT = 20_000;

/**
 * The candle being danced, pushed. Every connection reads the same shared
 * answer, so a hundred terminals on one contract cost the upstream exactly what
 * one does, and every one of them is shown the same step.
 */
export const loader = async ({ request, url }: Route.LoaderArgs) => {
  await requireUserId(request);

  const instrument = instrumentOr(url.searchParams.get("s"));
  const timeframe = parseTimeframe(url.searchParams.get("tf"));
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let sent: string | null = null;
      let closed = false;

      const push = (chunk: string) => {
        if (closed) {
          return;
        }

        controller.enqueue(encoder.encode(chunk));
      };

      const read = async () => {
        try {
          const { candles } = await tapeOf(instrument, timeframe);
          const newest = candles.at(-1);
          const chunk = newest ? JSON.stringify(newest) : null;

          if (chunk !== null && chunk !== sent) {
            sent = chunk;
            push(`data: ${chunk}\n\n`);
          }
        } catch {
          // A feed that is down is not a stream that should end. The next read
          // answers, and the client never learns the difference.
        }
      };

      const ticker = setInterval(read, TICK);
      const beat = setInterval(() => push(": beat\n\n"), HEARTBEAT);

      read();

      const stop = () => {
        if (closed) {
          return;
        }

        closed = true;
        clearInterval(ticker);
        clearInterval(beat);
        controller.close();
      };

      request.signal.addEventListener("abort", stop);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // nginx buffers a proxied response until it fills. This is the stream.
      "X-Accel-Buffering": "no",
    },
  });
};
