import { type Candle, getCandles } from "@propsim/datasources";
import {
  activeWindow,
  findInstrument,
  instrumentOr,
  isWorking,
  nextWindow,
  priceUnits,
  type Side,
  tradeDateOf,
} from "@propsim/engine";
import { listFills } from "@propsim/orders";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { data, useFetcher, useNavigate, useRevalidator, useSearchParams } from "react-router";
import NewsStrip from "~/components/app/news-strip";
import type { ChartBar, ChartPriceLine } from "~/components/chart/candle-chart";
import CandleChart from "~/components/chart/candle-chart";
import ChartHeader from "~/components/chart/chart-header";
import TimeframeSwitcher from "~/components/chart/timeframe-switcher";
import AccountStrip from "~/components/trading/account-strip";
import Blotter from "~/components/trading/blotter";
import ChartMenu from "~/components/trading/chart-menu";
import { formatPrice } from "~/components/trading/format";
import MoveOrder, { type OrderMove } from "~/components/trading/move-order";
import NewsBanner from "~/components/trading/news-banner";
import Panel from "~/components/trading/panel";
import { barsPerDay, parseTimeframe, rangeFor } from "~/components/trading/timeframes";
import TradePanel, { type TicketPick } from "~/components/trading/trade-panel";
import { fillPriceFor, type OrderDraft } from "~/components/trading/trading-state";
import { loadAccount } from "~/lib/accounts.server";
import { requireUserId } from "~/lib/auth.server";

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

/** The tape is the title. A tab among twenty is found by its price, not its name. */
export const titleFor = (code: string, price: number | null) =>
  price === null ? `${code}, propsim.sh` : `${code} ${formatPrice(price)}`;

export const meta: Route.MetaFunction = ({ loaderData }) => {
  if (!loaderData) {
    return [{ title: "Terminal, propsim.sh" }, ...PRIVATE];
  }

  return [
    { title: titleFor(loaderData.instrument.code, loaderData.candles.at(-1)?.close ?? null) },
    ...PRIVATE,
  ];
};

/**
 * The last price the tape has printed, and the bar it printed on. Both come off
 * the same bar on purpose. The feed runs about ten minutes behind, so a fill
 * stamped with the wall clock carries a price from ten minutes before its own
 * timestamp, and every rule read against it is read on the wrong clock: a
 * blackout window judged there covers bars the trader has not been shown.
 *
 * The bar's open, which is where the matcher stamps its own fills, so a manual
 * trade and a filled resting order speak the same instant.
 */
const lastTraded = async (symbol: string) => {
  const candles = await getCandles({ symbol, interval: "1m", range: "1d" });
  const bar = candles.at(-1);

  return bar ? { price: bar.close, at: new Date(bar.time) } : null;
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

  // Named, never guessed. A fallback here would fill the wrong contract.
  const instrument = findInstrument(String(form.get("instrument") ?? ""));

  if (!instrument) {
    return { error: "That is not something this terminal can do." };
  }

  const tape = await lastTraded(instrument.symbol);
  // A cancel or a modify is a decision rather than a print, so a quiet feed
  // must not refuse one. Only a fill needs a price, and that is checked below.
  const at = tape?.at ?? new Date();

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

  if (intent !== "submit" && intent !== "close") {
    return { error: "That is not something this terminal can do." };
  }

  if (!tape) {
    return { error: "No price to fill against. The feed is not answering." };
  }

  const mark = tape.price;

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

  const [menu, setMenu] = useState<{ price: number; x: number; y: number } | null>(null);
  const [pick, setPick] = useState<TicketPick | null>(null);
  const [move, setMove] = useState<OrderMove | null>(null);

  const openMenu = useCallback(
    (price: number, x: number, y: number) => setMenu({ price, x, y }),
    [],
  );

  // Read through a ref, so the chart keeps one drag handler for its whole life
  // rather than rebinding every time the book comes back from the loader.
  const ordersRef = useRef(book.orders);

  useEffect(() => {
    ordersRef.current = book.orders;
  }, [book.orders]);

  const askToMove = useCallback((id: string, price: number) => {
    const order = ordersRef.current.find((one) => one.id === id);

    if (!order) return;

    setMove({
      id,
      label: `${order.side} ${order.type}`,
      quantity: order.quantity,
      from: order.price,
      to: price,
    });
  }, []);

  // Buying under the market is a limit and over it is a stop, and selling is
  // the same read upside down. The side and the level decide it, not a dropdown.
  const take = (side: Side) => {
    if (menu === null || last === null) {
      return;
    }

    const reached = side === "buy" ? menu.price <= last : menu.price >= last;

    setPick({ side, type: reached ? "limit" : "stop", price: menu.price });
    setMenu(null);
  };

  // `meta` only runs when the loader does. The tape moves in between, and the
  // tab has to move with it.
  useEffect(() => {
    document.title = titleFor(instrument.code, last);
  }, [instrument.code, last]);

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
        // The only lines that stand for something a trader can still change. A
        // position's entry is a fact, and the last price belongs to the tape.
        draggable: true,
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

      {account.status === "locked" && (
        <p className="rounded border border-warn/40 bg-warn/10 px-3 py-2 text-warn text-xs">
          This session hit the daily loss limit. You can still close what is open, and the next
          session opens at 17:00 CT.
        </p>
      )}

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
                onPickPrice={openMenu}
                onMove={askToMove}
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
            pick={pick}
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
      <MoveOrder
        move={move}
        busy={fetcher.state !== "idle"}
        onCancel={() => setMove(null)}
        onConfirm={(order) => {
          send({
            intent: "modify",
            id: order.id,
            price: String(order.to),
            quantity: String(order.quantity),
          });
          setMove(null);
        }}
      />

      {menu !== null && last !== null && (
        <ChartMenu
          price={menu.price}
          x={menu.x}
          y={menu.y}
          onPick={take}
          onClose={() => setMenu(null)}
        />
      )}
    </main>
  );
};

export default Trading;
