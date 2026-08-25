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

// Currency, not a bare number: every figure on the page is dollars, and one
// without the sign reads as a quantity.
const AMOUNT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatMoney = (value: number) => AMOUNT.format(value);

const DOLLARS = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** A plan is written in round dollars. Balances, which carry cents, are not. */
export const formatDollars = (value: number) => DOLLARS.format(value);

export const formatSigned = (value: number) => {
  // A value that rounds to nothing still carries its sign through Intl, so a row
  // that lost nothing would print "-0.00" and read as a loss.
  const rounded = Math.round(value * 100) / 100;
  if (rounded === 0) return AMOUNT.format(0);

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

type Step = [Intl.RelativeTimeFormatUnit, number];

const STEPS: Step[] = [
  ["minute", 60_000],
  ["hour", 3_600_000],
  ["day", 86_400_000],
  ["month", 2_592_000_000],
];

/** The largest unit the span has filled, so an hour is not sixty minutes. */
const stepFor = (span: number) => {
  let step: Step = STEPS[0];

  for (const next of STEPS) {
    if (span >= next[1]) {
      step = next;
    }
  }

  return step;
};

/** Formatted in the loader, or the text changes on hydration. */
export const formatRelative = (at: Date, now: Date) => {
  const since = now.getTime() - at.getTime();

  if (since < 120_000) {
    return "Active now";
  }

  const [unit, size] = stepFor(since);

  return RELATIVE.format(-Math.floor(since / size), unit);
};

/** The mirror of the above, for a moment that has not happened yet. */
export const formatCountdown = (at: Date, now: Date) => {
  const until = at.getTime() - now.getTime();

  if (until <= 0) {
    return formatRelative(at, now);
  }

  const [unit, size] = stepFor(until);

  return RELATIVE.format(Math.max(1, Math.floor(until / size)), unit);
};

/**
 * For something written rather than somebody last seen, which is why it says
 * "just now" where formatRelative says "Active now".
 */
export const formatAgo = (at: Date, now: Date) => {
  const since = now.getTime() - at.getTime();

  if (since < 60_000) {
    return "just now";
  }

  const [unit, size] = stepFor(since);

  return RELATIVE.format(-Math.floor(since / size), unit);
};

const REGIONS = new Intl.DisplayNames(["en"], { type: "region" });

const flagOf = (code: string) =>
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

const MOMENT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
  hour12: false,
});

/** UTC and said so. The reader's own zone is not knowable from a mail. */
export const formatMoment = (at: Date) => `${MOMENT.format(at)} UTC`;
