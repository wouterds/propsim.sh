import { equityOf, type Ledger, positionsOf, type Side } from "./fills";
import { type AccountRules, type Breach, breachOf, floorOf } from "./floors";
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

/** Every bar each held contract printed over the span being read. */
export type Tape = Map<string, Bar[]>;

export type Liquidation = {
  breach: Breach;
  /** The bar the floor was crossed in. */
  at: Date;
  /** Where each open contract is flattened. */
  marks: Map<string, number>;
};

export type Marking = {
  /** The worst the account stood across every bar read. */
  lowEquityCents: number;
  liquidation: Liquidation | null;
};

const minutesOf = (tape: Tape) => {
  const times = new Set<number>();

  for (const bars of tape.values()) {
    for (const bar of bars) {
      times.add(bar.time);
    }
  }

  return [...times].sort((a, b) => a - b);
};

const barsAt = (tape: Tape, time: number) => {
  const found = new Map<string, Bar>();

  for (const [code, bars] of tape) {
    const bar = bars.find((one) => one.time === time);

    if (bar) {
      found.set(code, bar);
    }
  }

  return found;
};

/**
 * Reads the tape a minute at a time and stops at the first bar that took the
 * account through a floor. Taking the whole span at once finds the same breach
 * but flattens it against a bar that had not printed when it happened.
 *
 * The book is only constant between two fills, so the caller passes the bars
 * since the last print and no others.
 */
export const markingOf = (
  ledger: Ledger,
  tape: Tape,
  rules: AccountRules,
  marks: { peakEquityCents: number; sessionOpenCents: number },
): Marking => {
  let lowEquityCents = equityOf(ledger);

  for (const time of minutesOf(tape)) {
    const bars = barsAt(tape, time);

    lowEquityCents = Math.min(lowEquityCents, lowEquityOf(ledger, bars));

    const breach = breachOf(rules, { ...marks, lowEquityCents });

    if (breach) {
      return {
        lowEquityCents,
        liquidation: {
          breach,
          at: new Date(time),
          marks: liquidationMarksOf(ledger, bars, floorOf(rules, marks)),
        },
      };
    }
  }

  return { lowEquityCents, liquidation: null };
};
