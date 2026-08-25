import {
  type CandlestickSeriesPartialOptions,
  type ChartOptions,
  CrosshairMode,
  type DeepPartial,
  LineStyle,
  TickMarkType,
  type Time,
} from "lightweight-charts";
import { TICK_SIZE } from "~/components/trading/mnq";

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

/**
 * The only reader of a colour out of CSS in the whole app. The `@theme static`
 * tokens land on `:root`, so the canvas paints from the same source as every
 * utility class and no hex is written down twice.
 */
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
 * Canvas will not resolve a `var(--color-up)` string, so the alpha is baked in
 * here instead. Tailwind minifies hex in the production stylesheet, which hands
 * `#00ff88` back as `#0f8`, so both spellings have to survive.
 */
export const withAlpha = (color: string, alpha: number) => {
  const digits = color.replace("#", "");
  const expanded =
    digits.length === 3 ? [...digits].map((digit) => digit + digit).join("") : digits;

  if (!/^[0-9a-f]{6}$/i.test(expanded)) return color;

  const value = Number.parseInt(expanded, 16);

  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
};

// lightweight-charts has no timezone option and treats every stamp as UTC, so
// the fix is formatting rather than shifting the bars off the times they print
// at. MNQ is a CME contract quoted against the New York session.
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

export const candleOptions = (theme: ChartTheme): CandlestickSeriesPartialOptions => ({
  upColor: theme.up,
  downColor: theme.down,
  wickUpColor: theme.up,
  wickDownColor: theme.down,
  borderVisible: false,
  // MNQ ticks in quarter points, so the default minMove of 0.01 fills the axis
  // with prices that cannot print.
  priceFormat: { type: "price", precision: 2, minMove: TICK_SIZE },
});
