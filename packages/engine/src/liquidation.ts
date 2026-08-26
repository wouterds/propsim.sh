import { equityOf, type Ledger, positionsOf, type Side } from "./fills";
import { type AccountRules, failedOf, trailingFloorOf } from "./floors";
import type { Bar } from "./matching";
import { priceUnits } from "./money";

/** The end of the bar's range that hurts an open position. */
const adverseOf = (side: Side, bar: Bar) =>
  side === "buy" ? priceUnits(bar.low) : priceUnits(bar.high);

/** The other end, which is where the same position stood at its best. */
const favourableOf = (side: Side, bar: Bar) =>
  side === "buy" ? priceUnits(bar.high) : priceUnits(bar.low);

type Edge = { open: number; adverse: number; favourable: number };

const edgesOf = (ledger: Ledger, bars: Map<string, Bar>) => {
  const edges = new Map<string, Edge>();

  for (const position of positionsOf(ledger)) {
    const bar = bars.get(position.instrument);

    if (bar) {
      edges.set(position.instrument, {
        open: priceUnits(bar.open),
        adverse: adverseOf(position.side, bar),
        favourable: favourableOf(position.side, bar),
      });
    }
  }

  return edges;
};

const extremesOf = (edges: Map<string, Edge>, end: "adverse" | "favourable") =>
  new Map([...edges].map(([code, edge]): [string, number] => [code, edge[end]]));

/** Every open contract taken the same distance into its own bar. */
const marksAt = (edges: Map<string, Edge>, travelled: number) =>
  new Map(
    [...edges].map(([code, edge]): [string, number] => [
      code,
      Math.round(edge.open + travelled * (edge.adverse - edge.open)),
    ]),
  );

/**
 * The worst the account stood inside these bars. Nothing watches the tape
 * between two fills, so this is the only reading that catches a floor that was
 * crossed and left behind before the next print.
 */
export const lowEquityOf = (ledger: Ledger, bars: Map<string, Bar>) =>
  equityOf(ledger, extremesOf(edgesOf(ledger, bars), "adverse"));

/**
 * The best the account stood inside these bars. The trailing floor follows the
 * peak, and the peak counts open trade profit, so a rally that happened between
 * two prints raises the floor exactly as a banked one does.
 */
export const highEquityOf = (ledger: Ledger, bars: Map<string, Bar>) =>
  equityOf(ledger, extremesOf(edgesOf(ledger, bars), "favourable"));

/**
 * Where every open contract stood when the account met the floor. Equity is
 * linear in the distance travelled into the bar, so the crossing is one
 * division rather than a search, and one contract open on its own gives exactly
 * the price that puts the equity on the floor.
 *
 * A bar says nothing about the order its range was printed in, so taking every
 * position the same fraction of the way to its own worst price is the only
 * reading that does not invent a path.
 */
export const liquidationMarksOf = (ledger: Ledger, bars: Map<string, Bar>, floorCents: number) => {
  const edges = edgesOf(ledger, bars);
  const opening = equityOf(ledger, marksAt(edges, 0));
  const fallen = opening - equityOf(ledger, marksAt(edges, 1));

  // Already under the floor where the bar opened, so it gapped through and
  // there was no distance to travel.
  const travelled = fallen <= 0 ? 0 : (opening - floorCents) / fallen;

  return marksAt(edges, Math.min(1, Math.max(0, travelled)));
};

/** Every bar each held contract printed over the span being read. */
export type Tape = Map<string, Bar[]>;

export type Liquidation = {
  /** The bar the trailing floor was crossed in. */
  at: Date;
  /** Where each open contract is flattened. */
  marks: Map<string, number>;
};

export type Marking = {
  /** The worst the account stood across every bar read. */
  lowEquityCents: number;
  /** The best it stood, which the caller has to store or the floor forgets it. */
  peakEquityCents: number;
  liquidation: Liquidation | null;
};

/** Every instant the tape printed at, oldest first, with what printed there. */
const timelineOf = (tape: Tape) => {
  const at = new Map<number, Map<string, Bar>>();

  for (const [code, bars] of tape) {
    for (const bar of bars) {
      const found = at.get(bar.time) ?? new Map<string, Bar>();

      found.set(code, bar);
      at.set(bar.time, found);
    }
  }

  return [...at].sort(([one], [two]) => one - two);
};

/**
 * Reads the tape a bar at a time and stops at the first bar that took the
 * account through a floor. Taking the whole span at once finds the same breach
 * but flattens it against a bar that had not printed when it happened.
 *
 * The book is only constant between two fills, so the caller passes the bars
 * since the last print and no others.
 *
 * Only the trailing floor is read. The daily floor ends the session and leaves
 * the position alone, so nothing is flattened for it.
 */
export const markingOf = (
  ledger: Ledger,
  tape: Tape,
  rules: AccountRules,
  peakEquityCents: number,
): Marking => {
  let lowEquityCents = equityOf(ledger);
  let peak = peakEquityCents;

  for (const [time, bars] of timelineOf(tape)) {
    const low = lowEquityOf(ledger, bars);

    lowEquityCents = Math.min(lowEquityCents, low);

    // This bar's own low, never the running one. An earlier low was safe against
    // the floor of its own moment, and reading it again under a floor a later
    // peak dragged up ends the account for a dip it already survived.
    if (failedOf(rules, { lowEquityCents: low, peakEquityCents: peak })) {
      return {
        lowEquityCents,
        peakEquityCents: peak,
        liquidation: {
          at: new Date(time),
          marks: liquidationMarksOf(ledger, bars, trailingFloorOf(rules, peak)),
        },
      };
    }

    // After the breach check. A bar does not say which end printed first, so its
    // own high must not raise the floor over its own low.
    peak = Math.max(peak, highEquityOf(ledger, bars));
  }

  return { lowEquityCents, peakEquityCents: peak, liquidation: null };
};
