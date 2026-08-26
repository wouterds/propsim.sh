import type { Candle } from "@propsim/datasources";
import {
  type CandlestickData,
  CandlestickSeries,
  createChart,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  LineStyle,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
import {
  type ChartTheme,
  type ChartTone,
  candleOptions,
  chartOptions,
  readChartTheme,
} from "./chart-theme";

export type ChartBar = Pick<Candle, "time" | "open" | "high" | "low" | "close">;

export type ChartPriceLine = {
  id: string;
  price: number;
  tone: ChartTone;
  title: string;
  /** A working order, which is the only kind of line that can be moved. */
  draggable?: boolean;
};

type Props = {
  candles: Candle[];
  priceLines: ChartPriceLine[];
  /** The contract's smallest price move. */
  tick: number;
  visibleBars: number;
  /** A right click on the chart, at the price the cursor was over. */
  onPickPrice?: (price: number, x: number, y: number) => void;
  /** A draggable line let go at a new price. The line snaps back until the order moves. */
  onMove?: (id: string, price: number) => void;
  onHover: (bar: ChartBar | null) => void;
};

/** How near the cursor has to be to a line, in pixels, before it can take hold of it. */
const GRAB = 6;

const CandleChart = ({
  candles,
  priceLines,
  tick,
  visibleBars,
  onHover,
  onPickPrice,
  onMove,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
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

    return () => {
      // Null it first. React re-runs this effect in development and a disposed series throws.
      chartRef.current = null;
      seriesRef.current = null;
      themeRef.current = null;
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
        color: theme[line.tone],
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        lineVisible: true,
        axisLabelVisible: true,
        title: line.title,
        axisLabelColor: theme[line.tone],
        // White, like every other filled label. It is also what the series
        // picks for its own last value label, so the two axis badges agree.
        axisLabelTextColor: "#ffffff",
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

    let held: { id: string; price: number; api: IPriceLine } | null = null;
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

      if (!found) return;

      held = { id: found.line.id, price: found.line.price, api: found.api };
      container.setPointerCapture(event.pointerId);
    };

    const move = (event: PointerEvent) => {
      if (!held) {
        arm(lineAt(event.clientY) !== null);

        return;
      }

      const price = priceAt(event.clientY);

      if (price !== null) {
        held.api.applyOptions({ price: snap(price) });
      }
    };

    const up = (event: PointerEvent) => {
      if (!held) return;

      const price = priceAt(event.clientY);
      const { id, api, price: was } = held;

      held = null;
      container.releasePointerCapture(event.pointerId);
      api.applyOptions({ price: was });

      if (price !== null && snap(price) !== was) {
        onMove(id, snap(price));
      }
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

  return <div ref={containerRef} className="h-full w-full" />;
};

export default CandleChart;
