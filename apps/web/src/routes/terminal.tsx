import { type Candle, getCandles } from "@propsim/datasources";
import { findInstrument, instrumentOr, isWorking, priceUnits, tradeDateOf } from "@propsim/engine";
import { useEffect, useMemo, useRef, useState } from "react";
import { data, useFetcher, useNavigate, useRevalidator, useSearchParams } from "react-router";
import NewsStrip from "~/components/app/news-strip";
import type { ChartBar, ChartPriceLine } from "~/components/chart/candle-chart";
import CandleChart from "~/components/chart/candle-chart";
import ChartHeader from "~/components/chart/chart-header";
import TimeframeSwitcher from "~/components/chart/timeframe-switcher";
import AccountStrip from "~/components/trading/account-strip";
import Blotter from "~/components/trading/blotter";
import NewsBanner from "~/components/trading/news-banner";
import Panel from "~/components/trading/panel";
import { barsPerDay, parseTimeframe, rangeFor } from "~/components/trading/timeframes";
import TradePanel from "~/components/trading/trade-panel";
import { fillPriceFor, type OrderDraft } from "~/components/trading/trading-state";
import { listFills, loadAccount } from "~/lib/accounts.server";
import { requireUserId } from "~/lib/auth.server";
import { activeWindow, nextWindow } from "~/lib/blackout";
import { ordersOf, positionsIn } from "~/lib/blotter.server";
import { chartPrefs, readChartPrefs } from "~/lib/chart-prefs.server";
import { redFolderWindows } from "~/lib/news.server";
import {
  cancelOrder,
  closePosition,
  listOrders,
  modifyOrder,
  placeOrder,
} from "~/lib/orders.server";
import { PRIVATE } from "~/lib/seo";
import { useLivePrice } from "~/lib/use-live-price";
import type { Route } from "./+types/terminal";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Only the blotter needs this now: the tape arrives on its own stream. A fill
 * the matcher wrote shows up within this, against a sweep that runs a minute.
 */
const REFRESH = 30_000;

export const meta: Route.MetaFunction = ({ loaderData }) => [
  {
    title: loaderData ? `Terminal, ${loaderData.account.name}, propsim.sh` : "Terminal, propsim.sh",
  },
  ...PRIVATE,
];

const lastTraded = async (symbol: string) => {
  const candles = await getCandles({ symbol, interval: "1m", range: "1d" });

  return candles.at(-1)?.close ?? null;
};

const number = (form: FormData, key: string) => {
  const raw = form.get(key);

  if (raw === null || raw === "") {
    return null;
  }

  const value = Number(raw);

  return Number.isFinite(value) ? value : null;
};

/** `url`, not `request.url`: the latter carries a `.data` suffix on client navigation. */
export const loader = async ({ url, params, request }: Route.LoaderArgs) => {
  const userId = await requireUserId(request);

  // The address wins, so a shared link opens on what it names. The cookie is
  // what an address with nothing in it falls back to.
  const kept = await readChartPrefs(request);
  const timeframe = parseTimeframe(url.searchParams.get("tf") ?? kept.tf ?? null);
  const instrument = instrumentOr(url.searchParams.get("s") ?? kept.s);
  const loaded = await loadAccount(userId, params.id);

  if (!loaded) {
    throw new Response("No such account", { status: 404 });
  }

  const headers = {
    "Set-Cookie": await chartPrefs.serialize({ s: instrument.code, tf: timeframe }),
  };

  const [windows, orderRows, fillRows] = await Promise.all([
    redFolderWindows(),
    listOrders(loaded.row.id),
    listFills(loaded.row.id),
  ]);

  const today = tradeDateOf(new Date());
  // `ordersOf` maps one row to one order, so the index is the row it came from.
  const placed = ordersOf(orderRows, fillRows);
  const orders = placed.filter(
    (order, index) => orderRows[index].tradeDate === today || isWorking(order.status),
  );
  const positions = positionsIn(loaded.ledger, orderRows, fillRows);

  // Only once it is inside a day. Further out it is the calendar's job.
  const next = nextWindow(windows, Date.now());
  const upcoming = next && next.at - Date.now() < DAY ? { at: next.at, titles: next.titles } : null;

  const book = { orders, positions, realised: loaded.account.balance - loaded.account.plan.size };

  try {
    // The bar still printing is included here and nowhere else. It is what
    // makes the chart move between one closed bar and the next.
    const candles = await getCandles(
      { symbol: instrument.symbol, interval: timeframe, range: rangeFor(timeframe) },
      { forming: true },
    );

    return data(
      {
        account: loaded.account,
        book,
        instrument,
        timeframe,
        candles,
        windows,
        upcoming,
        error: null,
      },
      { headers },
    );
  } catch (cause) {
    // Caught, not rethrown. An error boundary would take the ticket and the
    // blotter down with the chart.
    const error = cause instanceof Error ? cause.message : "the price feed did not answer";

    return data(
      {
        account: loaded.account,
        book,
        instrument,
        timeframe,
        candles: [] as Candle[],
        windows,
        upcoming,
        error,
      },
      { headers },
    );
  }
};

/**
 * The fill price is the tape this server just read, never a number the form
 * carried. A refused write says why rather than marking to a stand in.
 */
export const action = async ({ params, request }: Route.ActionArgs) => {
  const userId = await requireUserId(request);
  const loaded = await loadAccount(userId, params.id);

  if (!loaded) {
    throw new Response("No such account", { status: 404 });
  }

  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  const at = new Date();

  if (intent === "cancel") {
    await cancelOrder(loaded.row.id, String(form.get("id") ?? ""), at);

    return { error: null };
  }

  if (intent === "modify") {
    const price = number(form, "price");
    const quantity = number(form, "quantity");

    if (price === null || quantity === null) {
      return { error: "A modify needs a price and a size." };
    }

    return {
      error: await modifyOrder(
        loaded.row.id,
        String(form.get("id") ?? ""),
        priceUnits(price),
        quantity,
        at,
      ),
    };
  }

  // Named, never guessed. A fallback here would fill the wrong contract.
  const instrument = findInstrument(String(form.get("instrument") ?? ""));

  if (!instrument || (intent !== "submit" && intent !== "close")) {
    return { error: "That is not something this terminal can do." };
  }

  const mark = await lastTraded(instrument.symbol);

  if (mark === null) {
    return { error: "No price to fill against. The feed is not answering." };
  }

  if (intent === "close") {
    return { error: await closePosition(loaded.row, instrument.code, priceUnits(mark), at) };
  }

  const type = String(form.get("type") ?? "market");
  const price = number(form, "price");
  const stopLoss = number(form, "stopLoss");
  const takeProfit = number(form, "takeProfit");

  return {
    error: await placeOrder(
      loaded.row,
      {
        instrument: instrument.code,
        side: form.get("side") === "sell" ? "sell" : "buy",
        type: type === "limit" || type === "stop" ? type : "market",
        quantity: number(form, "quantity") ?? 0,
        price: price === null ? null : priceUnits(price),
        stopLoss: stopLoss === null ? null : priceUnits(stopLoss),
        takeProfit: takeProfit === null ? null : priceUnits(takeProfit),
      },
      priceUnits(mark),
      at,
    ),
  };
};

const Trading = ({ loaderData }: Route.ComponentProps) => {
  const { account, book, instrument, timeframe, candles, windows, upcoming, error } = loaderData;
  const navigate = useNavigate();
  const fetcher = useFetcher<typeof action>();
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

  const revalidator = useRevalidator();
  const refresh = useRef(revalidator);

  useEffect(() => {
    refresh.current = revalidator;
  });

  // The loader carries the tape and the blotter, so this is also what puts a
  // fill the matcher wrote on the screen. Paused while the tab is hidden: a
  // chart nobody is looking at is not worth a request.
  useEffect(() => {
    const tick = setInterval(() => {
      if (!document.hidden && refresh.current.state === "idle") {
        refresh.current.revalidate();
      }
    }, REFRESH);

    return () => clearInterval(tick);
  }, []);

  const blackout = now === null ? null : activeWindow(windows, now);

  // Null, not a stand-in. Closing marks to this price and banks it for good.
  // Pushed, not polled. The bar still printing is carried forward to it, so
  // the last candle moves between one closed bar and the next.
  const live = useLivePrice(instrument.code);

  const bars = useMemo(() => {
    const settled = candles.at(-1);

    if (live === null || !settled) {
      return candles;
    }

    return [
      ...candles.slice(0, -1),
      {
        ...settled,
        close: live,
        high: Math.max(settled.high, live),
        low: Math.min(settled.low, live),
      },
    ];
  }, [candles, live]);

  const last = bars.at(-1)?.close ?? null;

  const openPnl = useMemo(() => {
    if (last === null) return null;

    return book.positions.reduce((total, position) => {
      const direction = position.side === "buy" ? 1 : -1;

      return total + (last - position.entry) * direction * position.quantity * instrument.point;
    }, 0);
  }, [book.positions, last, instrument.point]);

  const send = (fields: Record<string, string>) =>
    fetcher.submit({ instrument: instrument.code, ...fields }, { method: "post" });

  const submit = (draft: OrderDraft) => {
    if (last === null) return;

    send({
      intent: "submit",
      side: draft.side,
      type: draft.type,
      quantity: String(draft.quantity),
      price: draft.type === "market" ? "" : String(fillPriceFor(draft, last)),
      stopLoss: draft.stopLoss === null ? "" : String(draft.stopLoss),
      takeProfit: draft.takeProfit === null ? "" : String(draft.takeProfit),
    });
  };

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
      .filter((order) => isWorking(order.status))
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

      {blackout && now !== null ? (
        <NewsBanner titles={blackout.titles} endsIn={Math.ceil((blackout.to - now) / 1000)} />
      ) : (
        upcoming && <NewsStrip at={upcoming.at} titles={upcoming.titles} />
      )}
      <AccountStrip
        balance={account.balance}
        equity={openPnl === null ? null : account.balance + openPnl}
        realised={book.realised}
        openPnl={openPnl}
        positions={book.positions.length}
      />

      {fetcher.data?.error && (
        <p
          role="alert"
          className="rounded border border-down/40 bg-down/10 px-3 py-2 text-down text-xs"
        >
          {fetcher.data.error}
        </p>
      )}

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
                candles={bars}
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
            onSubmit={submit}
          />
        </Panel>

        <Blotter
          positions={book.positions}
          orders={book.orders}
          last={last}
          point={instrument.point}
          className="lg:col-start-1 lg:row-start-2 lg:min-h-0"
          onClose={(id) => send({ intent: "close", instrument: id })}
          onCancel={(id) => send({ intent: "cancel", id })}
        />
      </div>
    </main>
  );
};

export default Trading;
