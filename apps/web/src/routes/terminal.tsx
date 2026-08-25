import { type Candle, getCandles, getNewsEvents, isRedFolder } from "@propsim/datasources";
import { useEffect, useMemo, useState } from "react";
import { data, useNavigate, useSearchParams } from "react-router";
import type { ChartBar, ChartPriceLine } from "~/components/chart/candle-chart";
import CandleChart from "~/components/chart/candle-chart";
import ChartHeader from "~/components/chart/chart-header";
import TimeframeSwitcher from "~/components/chart/timeframe-switcher";
import AccountStrip from "~/components/trading/account-strip";
import Blotter from "~/components/trading/blotter";
import { instrumentOr } from "~/components/trading/instruments";
import NewsBanner from "~/components/trading/news-banner";
import Panel from "~/components/trading/panel";
import { barsPerDay, parseTimeframe, rangeFor } from "~/components/trading/timeframes";
import TradePanel from "~/components/trading/trade-panel";
import { usePaperTrading } from "~/components/trading/use-paper-trading";
import { findAccount } from "~/lib/accounts";
import { activeWindow, windowsOf } from "~/lib/blackout";
import { chartPrefs, readChartPrefs } from "~/lib/chart-prefs.server";
import type { Route } from "./+types/terminal";

export const meta: Route.MetaFunction = ({ loaderData }) => [
  {
    title: loaderData ? `Terminal, ${loaderData.account.name}, propsim.sh` : "Terminal, propsim.sh",
  },
];

/** `url`, not `request.url`: the latter carries a `.data` suffix on client navigation. */
export const loader = async ({ url, params, request }: Route.LoaderArgs) => {
  // The address wins, so a shared link opens on what it names. The cookie is
  // what an address with nothing in it falls back to.
  const kept = await readChartPrefs(request);
  const timeframe = parseTimeframe(url.searchParams.get("tf") ?? kept.tf ?? null);
  const instrument = instrumentOr(url.searchParams.get("s") ?? kept.s);
  const account = findAccount(params.id);

  if (!account) {
    throw new Response("No such account", { status: 404 });
  }

  const headers = {
    "Set-Cookie": await chartPrefs.serialize({ s: instrument.code, tf: timeframe }),
  };

  const news = (await getNewsEvents()).filter(isRedFolder);
  const windows = windowsOf(news.map((event) => ({ time: event.time, title: event.title })));

  try {
    const candles = await getCandles({
      symbol: instrument.symbol,
      interval: timeframe,
      range: rangeFor(timeframe),
    });

    return data({ account, instrument, timeframe, candles, windows, error: null }, { headers });
  } catch (cause) {
    // Caught, not rethrown. An error boundary would take the ticket and the
    // blotter down with the chart.
    const error = cause instanceof Error ? cause.message : "the price feed did not answer";

    return data(
      { account, instrument, timeframe, candles: [] as Candle[], windows, error },
      { headers },
    );
  }
};

const Trading = ({ loaderData }: Route.ComponentProps) => {
  const { account, instrument, timeframe, candles, windows, error } = loaderData;
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [hovered, setHovered] = useState<ChartBar | null>(null);

  // Null until the browser has it. Reading the clock while rendering on the
  // server puts a different answer in the markup than the one on hydration.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const tick = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(tick);
  }, []);

  const blackout = now === null ? null : activeWindow(windows, now);

  // Null, not a stand-in. Closing marks to this price and banks it for good.
  const last = candles.at(-1)?.close ?? null;
  const book = usePaperTrading(last, account.balance, instrument.point);

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

  const goToInstrument = (code: string) =>
    navigate(`?${new URLSearchParams({ ...Object.fromEntries(params), s: code })}`, {
      preventScrollReset: true,
    });

  // flex-1, not h-full: the shell holds this in a min-h-full column so the footer
  // sits below the fold, and a percentage height against a min-height is auto.
  return (
    <main className="flex flex-col gap-2 p-2 lg:min-h-0 lg:flex-1 lg:overflow-hidden">
      <h1 className="sr-only">{`Terminal, ${account.name}`}</h1>

      {blackout && now !== null && (
        <NewsBanner titles={blackout.titles} endsIn={Math.ceil((blackout.to - now) / 1000)} />
      )}
      <AccountStrip
        account={account.name}
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
              symbol={instrument.code}
              onSymbolChange={goToInstrument}
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
              <CandleChart
                candles={candles}
                priceLines={priceLines}
                bands={windows}
                tick={instrument.tick}
                visibleBars={barsPerDay(timeframe)}
                onHover={setHovered}
              />
            )}

            <div className="absolute top-2 right-2 z-10">
              <TimeframeSwitcher value={timeframe} />
            </div>
          </div>
        </section>

        <Panel
          title="New order"
          className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:min-h-0"
          bodyClassName="min-h-0 flex-1 overflow-y-auto"
        >
          <TradePanel
            last={last}
            tick={instrument.tick}
            point={instrument.point}
            onSubmit={book.submit}
          />
        </Panel>

        <Blotter
          positions={book.positions}
          orders={book.orders}
          last={last}
          point={instrument.point}
          className="lg:col-start-1 lg:row-start-2 lg:min-h-0"
          onClose={book.close}
          onCancel={book.cancel}
        />
      </div>
    </main>
  );
};

export default Trading;
