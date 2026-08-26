import type { Candle } from "@propsim/datasources";
import {
  activeWindow,
  findInstrument,
  type Instrument,
  instrumentOr,
  isWorking,
  priceUnits,
  type Side,
  shownWindow,
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
import { tapeOf } from "~/lib/tape.server";
import { useLiveCandle } from "~/lib/use-live-candle";
import type { Route } from "./+types/terminal";

const DAY = 24 * 60 * 60 * 1000;

/**
 * How long the notice stays up once the window has shut. The feed runs about
 * ten minutes behind, so the bars carrying the release are still arriving after
 * it, and taking the notice away at the close takes it away exactly as the
 * chart starts to move.
 */
const AFTER_RELEASE = 15 * 60 * 1000;

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
 * The step of the dance the trader is looking at, and the instant it opened.
 * Both come off the same step on purpose. The feed runs about ten minutes
 * behind, so a fill stamped with the wall clock carries a price from ten
 * minutes before its own timestamp, and every rule read against it is read on
 * the wrong clock: a blackout window judged there covers bars the trader has
 * not been shown.
 *
 * The step's own open, which is where the matcher stamps its fills too, so a
 * manual trade and a filled resting order speak the same instant. Stamping it
 * at the bar's open would put the click before every step it watched go by, and
 * a resting order placed on one could not fill until the next minute.
 */
const lastTraded = async (instrument: Instrument) => {
  const { step } = await tapeOf(instrument, "1m");

  return step ? { price: step.close, at: new Date(step.time) } : null;
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

  // Inside a day it is worth saying, further out it is the calendar's job, and
  // it stays up after the release because the bars carrying it are still on
  // their way to the chart.
  const shown = shownWindow(windows, Date.now(), DAY, AFTER_RELEASE);
  const upcoming = shown ? { at: shown.at, titles: shown.titles } : null;

  // Only this contract's, since the chart only ever draws one of them.
  const marks = fillRows
    .filter((fill) => fill.instrument === instrument.code)
    .map((fill) => ({ id: fill.id, time: fill.at.getTime(), side: fill.side }));

  const book = { orders, positions, realised: loaded.account.balance - loaded.account.plan.size };

  try {
    const { candles } = await tapeOf(instrument, timeframe);

    return data(
      {
        account: loaded.account,
        book,
        instrument,
        timeframe,
        candles,
        marks,
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
        marks,
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

  const tape = await lastTraded(instrument);
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
  const { account, book, instrument, timeframe, candles, marks, windows, upcoming, error } =
    loaderData;
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

  // Pushed, not polled, and the same candle the server fills against. The bar
  // it carries is one the tape already held complete, revealed a step at a time.
  const live = useLiveCandle(instrument.code, timeframe);

  const bars = useMemo(() => {
    const newest = candles.at(-1);

    if (live === null || !newest || live.time < newest.time) {
      return candles;
    }

    // The dance has crossed into a candle the loader was not asked for yet.
    if (live.time > newest.time) {
      return [...candles, live];
    }

    return [...candles.slice(0, -1), live];
  }, [candles, live]);

  const last = bars.at(-1)?.close ?? null;

  const [menu, setMenu] = useState<{ price: number; x: number; y: number } | null>(null);
  const [pick, setPick] = useState<TicketPick | null>(null);
  const [ticket, setTicket] = useState<OrderDraft | null>(null);
  const [move, setMove] = useState<{ id: string; price: number; quantity: number } | null>(null);

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

    setMove({ id, price, quantity: order.quantity });
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
        // A move waiting on an answer is drawn where it would land. Nothing has
        // changed on the order until it is confirmed.
        price: move?.id === order.id ? move.price : order.price,
        tone: order.side === "buy" ? "up" : "down",
        title: `${order.side} ${order.type}`,
        // The only lines that stand for something a trader can still change. A
        // position's entry is a fact, and the last price belongs to the tape.
        draggable: true,
      }));

    // The ticket as it stands, before anything is sent. A market order has no
    // level of its own, so only the brackets on it are worth drawing.
    const entry = ticket?.type === "market" ? null : (ticket?.limitPrice ?? null);
    const draftLines: ChartPriceLine[] = [];

    if (ticket && ticket.quantity > 0) {
      const size = `${ticket.quantity}`;

      if (entry !== null) {
        draftLines.push({
          id: "draft-entry",
          price: entry,
          tone: ticket.side === "buy" ? "up" : "down",
          title: `${ticket.side} ${size} ${ticket.type}`,
          draft: true,
        });
      }

      if (ticket.stopLoss !== null) {
        draftLines.push({
          id: "draft-sl",
          price: ticket.stopLoss,
          tone: "down",
          title: `stop ${size}`,
          draft: true,
        });
      }

      if (ticket.takeProfit !== null) {
        draftLines.push({
          id: "draft-tp",
          price: ticket.takeProfit,
          tone: "up",
          title: `target ${size}`,
          draft: true,
        });
      }
    }

    return [...openLines, ...restingLines, ...draftLines];
  }, [book.positions, book.orders, move, ticket]);

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
                markers={marks}
                tick={instrument.tick}
                visibleBars={barsPerDay(timeframe)}
                onHover={setHovered}
                onPickPrice={openMenu}
                onMove={askToMove}
                pending={move}
                busy={fetcher.state !== "idle"}
                onCancelMove={() => setMove(null)}
                onConfirmMove={() => {
                  if (!move) return;

                  send({
                    intent: "modify",
                    id: move.id,
                    price: String(move.price),
                    quantity: String(move.quantity),
                  });
                  setMove(null);
                }}
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
            onDraft={setTicket}
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
