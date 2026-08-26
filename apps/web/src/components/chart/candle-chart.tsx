import type { Candle } from "@propsim/datasources";
import {
  type CandlestickData,
  CandlestickSeries,
  createChart,
  createSeriesMarkers,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  LineStyle,
  type SeriesMarker,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { Check, X } from "lucide-react";
import { type RefObject, useEffect, useRef, useState } from "react";
import {
  type ChartTheme,
  type ChartTone,
  candleOptions,
  chartOptions,
  readChartTheme,
  withAlpha,
} from "./chart-theme";

export type ChartBar = Pick<Candle, "time" | "open" | "high" | "low" | "close">;

/** A fill, drawn as an arrow on the bar it printed in. */
type ChartMarker = {
  id: string;
  /** Milliseconds, the same clock as a candle. */
  time: number;
  side: "buy" | "sell";
};

export type ChartPriceLine = {
  id: string;
  price: number;
  tone: ChartTone;
  title: string;
  /** A working order, which is the only kind of line that can be moved. */
  draggable?: boolean;
  /** A ticket nobody has sent. Drawn faint and broken, so it reads as intent. */
  draft?: boolean;
  /** Picked out by the trader, drawn heavier so it is obvious which one is meant. */
  selected?: boolean;
};

type Props = {
  candles: Candle[];
  priceLines: ChartPriceLine[];
  markers?: ChartMarker[];
  /** The contract's smallest price move. */
  tick: number;
  visibleBars: number;
  /** A right click on the chart, at the price the cursor was over. */
  onPickPrice?: (price: number, x: number, y: number) => void;
  /** A draggable line let go at a new price. Nothing has moved until it is confirmed. */
  onMove?: (id: string, price: number) => void;
  /** The move waiting on an answer, drawn with a tick and a cross beside it. */
  pending?: { id: string; price: number } | null;
  onConfirmMove?: () => void;
  onCancelMove?: () => void;
  /** The working order the trader has picked out, so it can be cancelled. */
  selected?: { id: string; price: number } | null;
  onSelect?: (id: string | null) => void;
  onCancelOrder?: () => void;
  busy?: boolean;
  onHover: (bar: ChartBar | null) => void;
};

/**
 * Where a price sits on screen, followed each frame. The scale moves on its own
 * as bars arrive and lightweight-charts says nothing when it does, so anything
 * pinned to a price has to keep asking. The state only changes when it moves.
 */
const useLineY = (series: RefObject<ISeriesApi<"Candlestick"> | null>, price: number | null) => {
  const [y, setY] = useState<number | null>(null);

  useEffect(() => {
    if (price === null) {
      setY(null);

      return;
    }

    let frame = 0;

    const place = () => {
      const next = series.current?.priceToCoordinate(price) ?? null;

      setY((was) => (was === next ? was : next));
      frame = requestAnimationFrame(place);
    };

    place();

    return () => cancelAnimationFrame(frame);
  }, [series, price]);

  return y;
};

/** How near the cursor has to be to a line, in pixels, before it can take hold of it. */
const GRAB = 6;

const EMPTY: ChartMarker[] = [];

const CandleChart = ({
  candles,
  priceLines,
  markers = EMPTY,
  tick,
  visibleBars,
  onHover,
  onPickPrice,
  onMove,
  pending,
  onConfirmMove,
  onCancelMove,
  selected,
  onSelect,
  onCancelOrder,
  busy = false,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  /** Read through a ref, so the drag handler is bound once and never rebound. */
  const pick = useRef(onSelect);
  const themeRef = useRef<ChartTheme | null>(null);
  /** The tape the window was framed for, so a refresh does not re-frame it. */
  const framed = useRef<string | null>(null);
  const tickRef = useRef(tick);
  const hoverRef = useRef(onHover);
  /** What is on the chart right now, so the drag can find a line by where it sits. */
  const drawnRef = useRef<{ line: ChartPriceLine; api: IPriceLine }[]>([]);

  // In a ref so a new callback identity does not rebuild the chart.
  useEffect(() => {
    hoverRef.current = onHover;
  }, [onHover]);

  // Applied to the live series too, so switching contract reformats the axis
  // without rebuilding the chart.
  useEffect(() => {
    tickRef.current = tick;
    seriesRef.current?.applyOptions(candleOptions(themeRef.current ?? readChartTheme(), tick));
  }, [tick]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    // createChart is the first DOM access, so the module stays safe to import on the server.
    const theme = readChartTheme();
    const chart = createChart(container, chartOptions(theme));
    const series = chart.addSeries(CandlestickSeries, candleOptions(theme, tickRef.current));

    chart.subscribeCrosshairMove((param) => {
      const bar = param.seriesData.get(series) as CandlestickData<UTCTimestamp> | undefined;

      if (param.time === undefined || !bar) {
        hoverRef.current(null);
        return;
      }

      hoverRef.current({
        time: Number(bar.time) * 1000,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
      });
    });

    chartRef.current = chart;
    seriesRef.current = series;
    themeRef.current = theme;
    markersRef.current = createSeriesMarkers(series);

    return () => {
      // Null it first. React re-runs this effect in development and a disposed series throws.
      chartRef.current = null;
      seriesRef.current = null;
      themeRef.current = null;
      markersRef.current = null;
      chart.remove();
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;

    if (!chart || !series) return;

    // Candle.time is milliseconds. UTCTimestamp is seconds.
    const bars = candles.map((candle) => ({
      time: Math.floor(candle.time / 1000) as UTCTimestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    series.setData(bars);

    // Only a new tape gets framed. A refresh must not throw away where the
    // trader scrolled to, and the oldest bar is what says the tape changed.
    const tape = `${visibleBars}:${bars[0]?.time ?? 0}`;

    if (framed.current === tape) {
      return;
    }

    framed.current = tape;

    // The fetch reaches back further than the view. Anything else makes a month
    // of bars unreadable and ties the window to the range asked for.
    if (bars.length <= visibleBars) {
      chart.timeScale().fitContent();

      return;
    }

    chart.timeScale().setVisibleLogicalRange({ from: bars.length - visibleBars, to: bars.length });
  }, [candles, visibleBars]);

  /**
   * A fill is drawn on the bar that was printing when it happened, which is the
   * last bar to open at or before it. Reading the interval off the timeframe
   * instead would put a fill in a session gap on its own.
   */
  useEffect(() => {
    const plugin = markersRef.current;
    const theme = themeRef.current;

    if (!plugin || !theme) return;

    const times = candles.map((candle) => Math.floor(candle.time / 1000) as UTCTimestamp);

    const barAt = (seconds: number) => {
      let found: UTCTimestamp | null = null;

      for (const time of times) {
        if (time > seconds) break;

        found = time;
      }

      return found;
    };

    const drawn = markers
      .flatMap((marker): SeriesMarker<Time>[] => {
        const time = barAt(Math.floor(marker.time / 1000));

        if (time === null) return [];

        return [
          {
            time,
            position: marker.side === "buy" ? "belowBar" : "aboveBar",
            shape: marker.side === "buy" ? "arrowUp" : "arrowDown",
            // The same two tones the candles use, so a fill reads as the side it
            // was rather than as a third thing the chart draws.
            color: marker.side === "buy" ? theme.up : theme.down,
          },
        ];
      })
      // The plugin draws them in the order given and expects them oldest first.
      .sort((a, b) => Number(a.time) - Number(b.time));

    plugin.setMarkers(drawn);
  }, [candles, markers]);

  // The chart owns the price scale, so it is the only thing that can turn a
  // cursor into a price. Snapped to the tick, since no order rests off it.
  useEffect(() => {
    const container = containerRef.current;
    const series = seriesRef.current;

    if (!container || !series || !onPickPrice) return;

    const open = (event: MouseEvent) => {
      const price = series.coordinateToPrice(event.clientY - container.getBoundingClientRect().top);

      if (price === null) return;

      event.preventDefault();
      onPickPrice(Math.round(price / tick) * tick, event.clientX, event.clientY);
    };

    container.addEventListener("contextmenu", open);

    return () => container.removeEventListener("contextmenu", open);
  }, [onPickPrice, tick]);

  useEffect(() => {
    const series = seriesRef.current;
    const theme = themeRef.current;

    if (!series || !theme) return;

    const drawn = priceLines.map((line) => ({
      line,
      api: series.createPriceLine({
        price: line.price,
        // A draft is the same colour half faded and broken up, so it reads as a
        // level being chosen rather than one the account is holding.
        color: line.draft ? withAlpha(theme[line.tone], 0.5) : theme[line.tone],
        lineWidth: line.selected ? 2 : 1,
        lineStyle: line.draft ? LineStyle.SparseDotted : LineStyle.Dashed,
        lineVisible: true,
        axisLabelVisible: true,
        title: line.title,
        // A resting order is a filled badge. A draft is the same colour on the
        // chart's own ground instead, so the two never read as the same thing
        // sitting at the same price.
        axisLabelColor: line.draft ? theme.overlay : theme[line.tone],
        // White on a filled badge, which is what the series picks for its own
        // last value label, so every filled badge on the axis agrees.
        axisLabelTextColor: line.draft ? theme[line.tone] : "#ffffff",
      }),
    }));

    drawnRef.current = drawn;

    return () => {
      drawnRef.current = [];

      // On unmount the chart cleanup already disposed the series.
      if (seriesRef.current !== series) return;

      for (const one of drawn) {
        series.removePriceLine(one.api);
      }
    };
  }, [priceLines]);

  /**
   * Dragging a working order to a new level. The chart pans on a drag of its
   * own, so it has to be told to let go while the cursor is over a line, and
   * told again on the way out.
   *
   * The line is put back where it was on release. Nothing has moved yet at that
   * point: the caller confirms first, and the order redrawing at its new price
   * is what actually moves it.
   */
  useEffect(() => {
    const container = containerRef.current;
    const chart = chartRef.current;
    const series = seriesRef.current;

    if (!container || !chart || !series || !onMove) return;

    const priceAt = (clientY: number) =>
      series.coordinateToPrice(clientY - container.getBoundingClientRect().top);

    const snap = (price: number) => Math.round(price / tickRef.current) * tickRef.current;

    const lineAt = (clientY: number) => {
      const y = clientY - container.getBoundingClientRect().top;

      const near = drawnRef.current
        .filter((one) => one.line.draggable)
        .map((one) => ({
          one,
          away: Math.abs((series.priceToCoordinate(one.line.price) ?? -1e6) - y),
        }))
        .filter((found) => found.away <= GRAB)
        .sort((a, b) => a.away - b.away);

      return near[0]?.one ?? null;
    };

    let held: { id: string; price: number } | null = null;

    // Looked up each time rather than kept from the press. The lines are redrawn
    // whenever the book or the tape moves, and the handle taken at the start of
    // a drag is disposed by the next redraw.
    const lineFor = (id: string) => drawnRef.current.find((one) => one.line.id === id)?.api ?? null;
    let armed = false;

    const arm = (on: boolean) => {
      if (armed === on) return;

      armed = on;
      container.style.cursor = on ? "ns-resize" : "";
      // Before the press rather than during it, or the pan has already started.
      chart.applyOptions({ handleScroll: !on, handleScale: !on });
    };

    const down = (event: PointerEvent) => {
      const found = event.button === 0 ? lineAt(event.clientY) : null;

      if (!found) {
        if (event.button === 0) pick.current?.(null);

        return;
      }

      held = { id: found.line.id, price: found.line.price };
      container.setPointerCapture(event.pointerId);
    };

    const move = (event: PointerEvent) => {
      if (!held) {
        arm(lineAt(event.clientY) !== null);

        return;
      }

      const price = priceAt(event.clientY);

      if (price !== null) {
        lineFor(held.id)?.applyOptions({ price: snap(price) });
      }
    };

    const up = (event: PointerEvent) => {
      if (!held) return;

      const price = priceAt(event.clientY);
      const { id, price: was } = held;

      held = null;
      container.releasePointerCapture(event.pointerId);
      // Back to the price the order really has. The answer being waited on is
      // what draws it at the new one, so a cancel needs nothing put back.
      lineFor(id)?.applyOptions({ price: was });

      // A press that moved nothing is a pick, not a drag. Anywhere else on the
      // chart clears it, so the control never outlives what it belongs to.
      if (price === null || snap(price) === was) {
        pick.current?.(id);

        return;
      }

      onMove(id, snap(price));
    };

    const leave = () => {
      if (!held) arm(false);
    };

    container.addEventListener("pointerdown", down);
    container.addEventListener("pointermove", move);
    container.addEventListener("pointerup", up);
    container.addEventListener("pointerleave", leave);

    return () => {
      container.removeEventListener("pointerdown", down);
      container.removeEventListener("pointermove", move);
      container.removeEventListener("pointerup", up);
      container.removeEventListener("pointerleave", leave);
      arm(false);
    };
  }, [onMove]);

  useEffect(() => {
    pick.current = onSelect;
  }, [onSelect]);

  const pendingY = useLineY(seriesRef, pending?.price ?? null);
  const selectedY = useLineY(seriesRef, selected?.price ?? null);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {/* Nothing is waiting on an answer, so the pick is what gets a control. */}
      {!pending && selected && selectedY !== null && (
        <div
          style={{ top: selectedY }}
          className="-translate-y-1/2 pointer-events-none absolute right-20 z-10 flex items-stretch overflow-hidden rounded border border-line bg-raised/95 shadow-[0_2px_8px_-2px_rgb(0_0_0/0.6)] backdrop-blur-sm"
        >
          <button
            type="button"
            aria-label="Cancel this order"
            disabled={busy}
            onClick={onCancelOrder}
            className="pointer-events-auto flex h-5 items-center gap-1 px-1.5 text-[11px] text-faint transition-colors hover:bg-down/15 hover:text-down focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-50"
          >
            <X aria-hidden="true" className="size-3" strokeWidth={2.5} />
            Cancel
          </button>
        </div>
      )}

      {pending && pendingY !== null && (
        <div
          style={{ top: pendingY }}
          className="-translate-y-1/2 pointer-events-none absolute right-20 z-10 flex items-stretch overflow-hidden rounded border border-line bg-raised/95 shadow-[0_2px_8px_-2px_rgb(0_0_0/0.6)] backdrop-blur-sm"
        >
          <button
            type="button"
            aria-label="Leave the order where it was"
            disabled={busy}
            onClick={onCancelMove}
            className="pointer-events-auto flex h-5 w-6 items-center justify-center text-faint transition-colors hover:bg-overlay hover:text-ink focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-50"
          >
            <X aria-hidden="true" className="size-3" strokeWidth={2.5} />
          </button>
          <span aria-hidden className="w-px shrink-0 bg-line" />
          <button
            type="button"
            aria-label="Move the order here"
            disabled={busy}
            onClick={onConfirmMove}
            className="pointer-events-auto flex h-5 w-6 items-center justify-center text-up transition-colors hover:bg-up/15 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-50"
          >
            <Check aria-hidden="true" className="size-3" strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
};

export default CandleChart;
