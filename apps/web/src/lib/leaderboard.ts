import type { RoundTrip } from "@propsim/engine";

export type Span = "7d" | "30d" | "all";

export const SPANS: { id: Span; label: string; period: string; days: number | null }[] = [
  { id: "7d", label: "7 days", period: "the last 7 days", days: 7 },
  { id: "30d", label: "30 days", period: "the last 30 days", days: 30 },
  { id: "all", label: "All time", period: "all time", days: null },
];

export const periodOf = (span: Span) =>
  SPANS.find((entry) => entry.id === span)?.period ?? "all time";

const DAY = 24 * 60 * 60 * 1000;

export const spanOr = (value: string | null | undefined): Span =>
  SPANS.find((span) => span.id === value)?.id ?? "7d";

/** Null over all time, which is the one span with nothing to measure back from. */
export const cutoffOf = (span: Span, now: Date) => {
  const days = SPANS.find((entry) => entry.id === span)?.days ?? null;

  if (days === null) {
    return null;
  }

  return new Date(now.getTime() - days * DAY);
};

/**
 * Profit banked inside the span, so a position still open counts for nothing
 * until it closes. A leaderboard that marked open trades would rank guesses.
 */
export const bankedSince = (trips: RoundTrip[], cutoff: Date | null) =>
  trips.reduce((total, trip) => {
    if (cutoff && trip.closedAt < cutoff) {
      return total;
    }

    return total + trip.pnlCents;
  }, 0);

export type Standing = {
  userId: string;
  name: string;
  initials: string;
  hue: number;
  accounts: number;
  startingCents: number;
  pnlCents: number;
};

/** Null when nobody has traded, rather than a hundred per cent of nothing. */
export const profitableShare = (standings: Standing[]) => {
  if (standings.length === 0) {
    return null;
  }

  return standings.filter((standing) => standing.pnlCents > 0).length / standings.length;
};

export const medianPnlOf = (standings: Standing[]) => {
  if (standings.length === 0) {
    return null;
  }

  const sorted = standings.map((standing) => standing.pnlCents).sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }

  return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
};

/** Against the balance they started with, so a 25K and a 150K rank alike. */
export const returnOf = (standing: Standing) => {
  if (standing.startingCents === 0) {
    return 0;
  }

  return standing.pnlCents / standing.startingCents;
};
