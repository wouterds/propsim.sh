import type { Candle } from "@propsim/datasources";
import {
  type CandlestickData,
  CandlestickSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  LineStyle,
  type Logical,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
import { logicalAt } from "~/lib/chart-scale";
import {
  type ChartTheme,
  type ChartTone,
  candleOptions,
  chartOptions,
  readChartTheme,
} from "./chart-theme";

export type ChartBar = Pick<Candle, "time" | "open" | "high" | "low" | "close">;

export type ChartPriceLine = { id: string; price: number; tone: ChartTone; title: string };

export type ChartBand = { from: number; to: number; at: number };

type Props = {
  candles: Candle[];
  priceLines: ChartPriceLine[];
  /** Spans in milliseconds, drawn behind the bars. */
  bands: ChartBand[];
  visibleBars: number;
  onHover: (bar: ChartBar | null) => void;
};

const CandleChart = ({ candles, priceLines, bands, visibleBars, onHover }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bandsRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const themeRef = useRef<ChartTheme | null>(null);
  const hoverRef = useRef(onHover);

  // In a ref so a new callback identity does not rebuild the chart.
  useEffect(() => {
    hoverRef.current = onHover;
  }, [onHover]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    // createChart is the first DOM access, so the module stays safe to import on the server.
    const theme = readChartTheme();
    const chart = createChart(container, chartOptions(theme));
    const series = chart.addSeries(CandlestickSeries, candleOptions(theme));

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

    // The fetch reaches back further than the view. Anything else makes a month
    // of bars unreadable and ties the window to the range asked for.
    if (bars.length <= visibleBars) {
      chart.timeScale().fitContent();

      return;
    }

    chart.timeScale().setVisibleLogicalRange({ from: bars.length - visibleBars, to: bars.length });
  }, [candles, visibleBars]);

  useEffect(() => {
    const series = seriesRef.current;
    const theme = themeRef.current;

    if (!series || !theme) return;

    const drawn = priceLines.map((line) =>
      series.createPriceLine({
        price: line.price,
        color: theme[line.tone],
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        lineVisible: true,
        axisLabelVisible: true,
        title: line.title,
        axisLabelColor: theme[line.tone],
        axisLabelTextColor: theme.sunken,
      }),
    );

    return () => {
      // On unmount the chart cleanup already disposed the series.
      if (seriesRef.current !== series) return;

      for (const line of drawn) {
        series.removePriceLine(line);
      }
    };
  }, [priceLines]);

  // Lightweight Charts draws no vertical span of its own, so the band is a div
  // placed from the time scale and moved whenever the view does.
  useEffect(() => {
    const chart = chartRef.current;
    const layer = bandsRef.current;

    if (!chart || !layer) return;

    const times = candles.map((candle) => candle.time);

    const draw = () => {
      const scale = chart.timeScale();
      const view = scale.getVisibleLogicalRange();

      layer.replaceChildren();

      if (!view) return;

      for (const band of bands) {
        const from = logicalAt(times, band.from);
        const to = logicalAt(times, band.to);
        const middle = logicalAt(times, band.at);

        if (from === null || to === null || middle === null) continue;

        // Asked for a bar it is not showing, the scale answers with a
        // coordinate that means nothing, and the band lands against an edge.
        if (to < view.from || from > view.to) continue;

        const left = scale.logicalToCoordinate(from as Logical);
        const right = scale.logicalToCoordinate(to as Logical);
        const centre = scale.logicalToCoordinate(middle as Logical);

        if (left === null || right === null || centre === null) continue;

        // Two minutes is thinner than a pixel on anything but the tightest
        // timeframe, so the band keeps a floor and the release gets its own line.
        const width = layer.clientWidth;
        const start = Math.max(left, 0);
        const end = Math.min(Math.max(right, left + 8), width);

        if (end <= 0 || start >= width) continue;

        const span = document.createElement("div");
        span.className = "absolute inset-y-0 bg-down/15";
        span.style.left = `${start}px`;
        span.style.width = `${end - start}px`;

        const mark = document.createElement("div");
        mark.className = "absolute inset-y-0 w-0.5 bg-down/80";
        mark.style.left = `${centre}px`;

        layer.append(span, mark);
      }
    };

    draw();

    const scale = chart.timeScale();
    scale.subscribeVisibleLogicalRangeChange(draw);

    return () => {
      scale.unsubscribeVisibleLogicalRangeChange(draw);
      layer.replaceChildren();
    };
  }, [bands, candles]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <div
        ref={bandsRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      />
    </div>
  );
};

export default CandleChart;
