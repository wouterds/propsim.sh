import type { EquityPoint, Ledger, RoundTrip } from "./fills";

export type Verdict = "clean" | "watch" | "breached";

/**
 * The part of a session that cannot be worked out from the fills: where the
 * equity stood when it opened, and how far down it went between two prints.
 */
export type DayAnchor = {
  tradeDate: string;
  openEquityCents: number;
  lowEquityCents: number;
};

export type DaySummary = {
  date: string;
  trades: number;
  wins: number;
  /** Never above zero. Measured from the session open, not from the day's high. */
  worstDrawdownCents: number;
  pnlCents: number;
  verdict: Verdict;
};

/** How much of the daily limit a session may spend before the row is flagged. */
export const WATCH_AT = 0.5;

const byDate = <T extends { tradeDate: string }>(rows: T[]) => {
  const groups = new Map<string, T[]>();

  for (const row of rows) {
    const held = groups.get(row.tradeDate);

    if (held) {
      held.push(row);
      continue;
    }

    groups.set(row.tradeDate, [row]);
  }

  return groups;
};

const verdictOf = (spent: number, limitCents: number): Verdict => {
  if (spent >= limitCents) return "breached";
  if (spent > limitCents * WATCH_AT) return "watch";

  return "clean";
};

const summarise = (
  anchor: DayAnchor,
  trips: RoundTrip[],
  points: EquityPoint[],
  limitCents: number,
): DaySummary => {
  const closing = points.at(-1)?.equityCents ?? anchor.openEquityCents;
  const low = points.reduce(
    (worst, point) => Math.min(worst, point.equityCents),
    Math.min(anchor.openEquityCents, anchor.lowEquityCents),
  );

  return {
    date: anchor.tradeDate,
    trades: trips.length,
    wins: trips.filter((trip) => trip.pnlCents > 0).length,
    worstDrawdownCents: low - anchor.openEquityCents,
    pnlCents: closing - anchor.openEquityCents,
    verdict: verdictOf(anchor.openEquityCents - low, limitCents),
  };
};

/**
 * The verdict is taken from the deepest point of the session rather than from
 * where it closed, so a day that went through the floor and came back is still
 * a breach. Newest first, which is the order the journal reads in.
 */
export const summariseDays = (
  ledger: Ledger,
  anchors: DayAnchor[],
  limitCents: number,
  mark?: EquityPoint,
): DaySummary[] => {
  const path = mark ? [...ledger.path, mark] : ledger.path;
  const trips = byDate(ledger.trips);
  const points = byDate(path);

  return anchors
    .map((anchor) =>
      summarise(
        anchor,
        trips.get(anchor.tradeDate) ?? [],
        points.get(anchor.tradeDate) ?? [],
        limitCents,
      ),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
};
