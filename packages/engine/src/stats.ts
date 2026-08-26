import type { RoundTrip } from "./fills";

export type TraderStats = {
  trades: number;
  wins: number;
  /** Null until something has closed, so nothing reads 0% on an empty record. */
  winRate: number | null;
  /** Banked movement less every side charged. */
  pnlCents: number;
  feesCents: number;
  grossWinCents: number;
  grossLossCents: number;
  /** Gross won over gross given back. Null while nothing has been lost yet. */
  profitFactor: number | null;
  averageWinCents: number | null;
  averageLossCents: number | null;
  /** Seconds a position was held, averaged over closed trips. */
  averageHeldSeconds: number | null;
  sessions: number;
  bestDayCents: number | null;
  worstDayCents: number | null;
};

/** What a trip was worth to the account, which is the movement less its commission. */
const netOf = (trip: RoundTrip) => trip.pnlCents - trip.feeCents;

const mean = (total: number, count: number) => (count === 0 ? null : Math.round(total / count));

/**
 * A trader's whole record, folded from every trip they closed. Commission is
 * taken off before a trip is called a winner, because a trade that made less
 * than it cost to take did not make money.
 */
export const statsOf = (trips: RoundTrip[]): TraderStats => {
  const byDay = new Map<string, number>();
  let wins = 0;
  let pnlCents = 0;
  let feesCents = 0;
  let grossWinCents = 0;
  let grossLossCents = 0;
  let heldSeconds = 0;

  for (const trip of trips) {
    const net = netOf(trip);

    pnlCents += net;
    feesCents += trip.feeCents;
    heldSeconds += (trip.closedAt.getTime() - trip.openedAt.getTime()) / 1000;

    if (net > 0) {
      wins += 1;
      grossWinCents += net;
    } else {
      grossLossCents += Math.abs(net);
    }

    byDay.set(trip.tradeDate, (byDay.get(trip.tradeDate) ?? 0) + net);
  }

  const days = [...byDay.values()];
  const losses = trips.length - wins;

  return {
    trades: trips.length,
    wins,
    winRate: trips.length === 0 ? null : wins / trips.length,
    pnlCents,
    feesCents,
    grossWinCents,
    grossLossCents,
    profitFactor: grossLossCents === 0 ? null : grossWinCents / grossLossCents,
    averageWinCents: mean(grossWinCents, wins),
    averageLossCents: mean(grossLossCents, losses),
    averageHeldSeconds: mean(heldSeconds, trips.length),
    sessions: byDay.size,
    bestDayCents: days.length === 0 ? null : Math.max(...days),
    worstDayCents: days.length === 0 ? null : Math.min(...days),
  };
};
