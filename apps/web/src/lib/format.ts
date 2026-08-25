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
