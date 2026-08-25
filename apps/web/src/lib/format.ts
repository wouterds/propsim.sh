export type Tone = "up" | "down" | "neutral";

export const TONE_TEXT: Record<Tone, string> = {
  up: "text-up",
  down: "text-down",
  neutral: "text-ink",
};

export type FloorTone = "up" | "warn" | "down";

export const FLOOR_TEXT: Record<FloorTone, string> = {
  up: "text-up",
  warn: "text-warn",
  down: "text-down",
};

export const FLOOR_BAR: Record<FloorTone, string> = {
  up: "bg-up",
  warn: "bg-warn",
  down: "bg-down",
};

const AMOUNT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatMoney = (value: number) => AMOUNT.format(value);

export const formatSigned = (value: number) => {
  // A value that rounds to nothing still carries its sign through Intl, so a row
  // that lost nothing would print "-0.00" and read as a loss.
  const rounded = Math.round(value * 100) / 100;
  if (rounded === 0) return "0.00";

  const sign = rounded > 0 ? "+" : "-";
  return `${sign}${AMOUNT.format(Math.abs(rounded))}`;
};

export const formatPercent = (fraction: number) => `${Math.round(fraction * 100)}%`;

export const toneOf = (value: number): Tone => {
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "neutral";
};

const DAY = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** UTC, so the server and the browser never disagree on which day a row is. */
export const formatDay = (iso: string) => DAY.format(new Date(`${iso}T00:00:00Z`));

const MONTH = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export const formatDate = (iso: string) => MONTH.format(new Date(`${iso}T00:00:00Z`));

const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["minute", 60_000],
  ["hour", 3_600_000],
  ["day", 86_400_000],
  ["month", 2_592_000_000],
];

/**
 * Formatted where the data is read, not where it is drawn. A clock difference
 * between the server and the browser would otherwise change the text on
 * hydration.
 */
export const formatRelative = (at: Date, now: Date) => {
  const since = now.getTime() - at.getTime();

  if (since < 120_000) {
    return "Active now";
  }

  let unit: Intl.RelativeTimeFormatUnit = "minute";
  let size = 60_000;

  for (const [next, span] of STEPS) {
    if (since >= span) {
      unit = next;
      size = span;
    }
  }

  return RELATIVE.format(-Math.floor(since / size), unit);
};

const REGIONS = new Intl.DisplayNames(["en"], { type: "region" });

/** A flag is two regional indicators, which are the letters offset into their own block. */
export const flagOf = (code: string) =>
  String.fromCodePoint(...[...code.toUpperCase()].map((letter) => 0x1_f1a5 + letter.charCodeAt(0)));

export const countryOf = (code: string | null) => {
  if (!code) {
    return null;
  }

  try {
    return { name: REGIONS.of(code) ?? code, flag: flagOf(code) };
  } catch {
    return { name: code, flag: "" };
  }
};
