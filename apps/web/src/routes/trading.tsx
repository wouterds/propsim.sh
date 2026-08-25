import { type Candle, getCandles } from "@propsim/datasources";
import { useMemo, useState } from "react";
import type { ChartBar, ChartPriceLine } from "~/components/chart/candle-chart";
import CandleChart from "~/components/chart/candle-chart";
import ChartHeader from "~/components/chart/chart-header";
import TimeframeSwitcher from "~/components/chart/timeframe-switcher";
import AccountStrip from "~/components/trading/account-strip";
import Blotter from "~/components/trading/blotter";
import { parseTimeframe, rangeFor, SYMBOL } from "~/components/trading/mnq";
import Panel from "~/components/trading/panel";
import TradePanel from "~/components/trading/trade-panel";
import { usePaperTrading } from "~/components/trading/use-paper-trading";
import type { Route } from "./+types/trading";

export const meta = () => [{ title: "Trading — propsim.sh" }];

/** `url`, not `request.url`: the latter carries a `.data` suffix on client navigation. */
export const loader = async ({ url }: Route.LoaderArgs) => {
  const timeframe = parseTimeframe(url.searchParams.get("tf"));

  try {
    const candles = await getCandles({
      symbol: SYMBOL,
      interval: timeframe,
      range: rangeFor(timeframe),
    });

    return { symbol: SYMBOL, timeframe, candles, error: null };
  } catch (cause) {
    // Caught, not rethrown. An error boundary would take the ticket and the
    // blotter down with the chart.
    const error = cause instanceof Error ? cause.message : "the price feed did not answer";

    return { symbol: SYMBOL, timeframe, candles: [] as Candle[], error };
  }
};

const Trading = ({ loaderData }: Route.ComponentProps) => {
  const { symbol, timeframe, candles, error } = loaderData;
  const [hovered, setHovered] = useState<ChartBar | null>(null);

  // Null, not a stand-in. Closing marks to this price and banks it for good.
  const last = candles.at(-1)?.close ?? null;
  const book = usePaperTrading(last);

  // The chart redraws its price lines whenever this array changes identity.
  const priceLines = useMemo<ChartPriceLine[]>(() => {
    const openLines = book.positions.flatMap((position) => {
      const lines: ChartPriceLine[] = [
        { id: position.id, price: position.entry, tone: "accent", title: "entry" },
      ];

      if (position.stopLoss !== null) {
        lines.push({
          id: `${position.id}-sl`,
          price: position.stopLoss,
          tone: "down",
          title: "stop",
        });
      }

      if (position.takeProfit !== null) {
        lines.push({
          id: `${position.id}-tp`,
          price: position.takeProfit,
          tone: "up",
          title: "target",
        });
      }

      return lines;
    });

    const restingLines = book.orders
      .filter((order) => order.status === "working")
      .map<ChartPriceLine>((order) => ({
        id: order.id,
        price: order.price,
        tone: order.side === "buy" ? "up" : "down",
        title: `${order.side} ${order.type}`,
      }));

    return [...openLines, ...restingLines];
  }, [book.positions, book.orders]);

  return (
    <main className="flex flex-col gap-2 p-2 lg:h-full lg:overflow-hidden">
      <AccountStrip
        balance={book.balance}
        equity={book.equity}
        realised={book.realised}
        openPnl={book.openPnl}
        positions={book.positions.length}
      />

      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[minmax(0,1fr)_18rem] lg:grid-rows-[minmax(0,1fr)_16rem] 2xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-rows-[minmax(0,1fr)_18rem]">
        <section className="flex h-[46dvh] flex-col overflow-hidden rounded-lg border border-line bg-raised md:h-[54dvh] lg:col-start-1 lg:row-start-1 lg:h-auto lg:min-h-0">
          <div className="shrink-0 border-line border-b">
            <ChartHeader
              symbol={symbol}
              period={rangeFor(timeframe)}
              first={candles.at(0)}
              last={candles.at(-1)}
              hovered={hovered}
            />
          </div>

          <div className="relative min-h-0 flex-1">
            {error ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                <p className="font-medium text-down text-sm">No bars to draw</p>
                <p className="max-w-sm text-faint text-xs">{error}</p>
              </div>
            ) : (
              <CandleChart candles={candles} priceLines={priceLines} onHover={setHovered} />
            )}

            <div className="absolute top-2 right-2 z-10">
              <TimeframeSwitcher value={timeframe} />
            </div>
          </div>
        </section>

        <Panel
          title="Order ticket"
          className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:min-h-0"
          bodyClassName="min-h-0 flex-1 overflow-y-auto"
        >
          <TradePanel last={last} onSubmit={book.submit} />
        </Panel>

        <Blotter
          positions={book.positions}
          orders={book.orders}
          last={last}
          className="lg:col-start-1 lg:row-start-2 lg:min-h-0"
          onClose={book.close}
          onCancel={book.cancel}
        />
      </div>
    </main>
  );
};

export default Trading;
