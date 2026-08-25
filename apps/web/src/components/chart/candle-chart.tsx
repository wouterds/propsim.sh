import type { Candle } from "@propsim/datasources";
import {
  type CandlestickData,
  CandlestickSeries,
  createChart,
  type IChartApi,
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

export type ChartPriceLine = { id: string; price: number; tone: ChartTone; title: string };

type Props = {
  candles: Candle[];
  priceLines: ChartPriceLine[];
  visibleBars: number;
  onHover: (bar: ChartBar | null) => void;
};

const CandleChart = ({ candles, priceLines, visibleBars, onHover }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
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

  return <div ref={containerRef} className="h-full w-full" />;
};

export default CandleChart;
