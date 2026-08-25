import {
  type CandlestickSeriesPartialOptions,
  type ChartOptions,
  CrosshairMode,
  type DeepPartial,
  LineStyle,
  TickMarkType,
  type Time,
} from "lightweight-charts";

export type ChartTone = "up" | "down" | "accent";

export type ChartTheme = Record<ChartTone, string> & {
  base: string;
  sunken: string;
  overlay: string;
  line: string;
  faint: string;
};

const readToken = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export const readChartTheme = (): ChartTheme => ({
  base: readToken("--color-base"),
  sunken: readToken("--color-sunken"),
  overlay: readToken("--color-overlay"),
  line: readToken("--color-line"),
  faint: readToken("--color-faint"),
  up: readToken("--color-up"),
  down: readToken("--color-down"),
  accent: readToken("--color-accent"),
});

/**
 * Canvas cannot resolve a `var()`, so alpha is baked in here. Tailwind minifies
 * hex in production, so 3-digit and 6-digit both have to work.
 */
export const withAlpha = (color: string, alpha: number) => {
  const digits = color.replace("#", "");
  const expanded =
    digits.length === 3 ? [...digits].map((digit) => digit + digit).join("") : digits;

  if (!/^[0-9a-f]{6}$/i.test(expanded)) return color;

  const value = Number.parseInt(expanded, 16);

  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
};

// lightweight-charts has no timezone option and treats every stamp as UTC.
// Format the labels. Never shift the bars.
const EXCHANGE_ZONE = "America/New_York";

const clockFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: EXCHANGE_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dayFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: EXCHANGE_ZONE,
  month: "short",
  day: "numeric",
});

const stampFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: EXCHANGE_ZONE,
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const toDate = (time: Time) => new Date(Number(time) * 1000);

const formatTick = (time: Time, tickMarkType: TickMarkType) => {
  if (tickMarkType === TickMarkType.Time || tickMarkType === TickMarkType.TimeWithSeconds) {
    return clockFormat.format(toDate(time));
  }

  return dayFormat.format(toDate(time));
};

export const chartOptions = (theme: ChartTheme): DeepPartial<ChartOptions> => ({
  autoSize: true,
  layout: {
    background: { color: theme.base },
    textColor: theme.faint,
    fontSize: 11,
    attributionLogo: false,
  },
  grid: {
    vertLines: { color: withAlpha(theme.line, 0.55) },
    horzLines: { color: withAlpha(theme.line, 0.55) },
  },
  rightPriceScale: {
    borderColor: theme.line,
    scaleMargins: { top: 0.1, bottom: 0.1 },
  },
  crosshair: {
    mode: CrosshairMode.Normal,
    vertLine: {
      color: withAlpha(theme.accent, 0.45),
      style: LineStyle.Dashed,
      labelBackgroundColor: theme.overlay,
    },
    horzLine: {
      color: withAlpha(theme.accent, 0.45),
      style: LineStyle.Dashed,
      labelBackgroundColor: theme.overlay,
    },
  },
  localization: { timeFormatter: (time: Time) => stampFormat.format(toDate(time)) },
  timeScale: {
    borderColor: theme.line,
    // Off by default, which gives a date-only axis on intraday bars.
    timeVisible: true,
    secondsVisible: false,
    rightOffset: 6,
    barSpacing: 8,
    tickMarkFormatter: formatTick,
  },
});

/** Decimals enough to show one tick, so 0.005 prints three and 0.25 prints two. */
const precisionFor = (tick: number) => {
  const decimals = `${tick}`.split(".")[1]?.length ?? 0;

  return Math.min(decimals, 8);
};

export const candleOptions = (
  theme: ChartTheme,
  tick: number,
): CandlestickSeriesPartialOptions => ({
  upColor: theme.up,
  downColor: theme.down,
  wickUpColor: theme.up,
  wickDownColor: theme.down,
  borderVisible: false,
  // A contract ticks in its own increment. The default minMove prints prices
  // that cannot exist.
  priceFormat: { type: "price", precision: precisionFor(tick), minMove: tick },
});
