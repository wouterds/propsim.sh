import { equityOf, type Ledger, positionsOf, type Side } from "./fills";
import type { Bar } from "./matching";
import { priceUnits } from "./money";

/** The end of the bar's range that hurts an open position. */
const adverseOf = (side: Side, bar: Bar) =>
  side === "buy" ? priceUnits(bar.low) : priceUnits(bar.high);

type Edge = { open: number; adverse: number };

const edgesOf = (ledger: Ledger, bars: Map<string, Bar>) => {
  const edges = new Map<string, Edge>();

  for (const position of positionsOf(ledger)) {
    const bar = bars.get(position.instrument);

    if (bar) {
      edges.set(position.instrument, {
        open: priceUnits(bar.open),
        adverse: adverseOf(position.side, bar),
      });
    }
  }

  return edges;
};

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
  equityOf(ledger, marksAt(edgesOf(ledger, bars), 1));

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
