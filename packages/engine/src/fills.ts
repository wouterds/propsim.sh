import { contractOf, pointCentsOf } from "./instruments";
import { valueOfMove } from "./money";

export type Side = "buy" | "sell";

/**
 * Structural on purpose. A stored row, a delayed live tick and a literal in a
 * spec all satisfy it, so nothing downstream can tell which one it was given.
 */
export type Fill = {
  instrument: string;
  side: Side;
  quantity: number;
  /** In price units, see PRICE_SCALE. */
  price: number;
  at: Date;
  /** Stamped by whatever produced the fill. Nothing downstream re-cuts the session. */
  tradeDate: string;
};

/** Signed: a positive quantity is long. */
export type Lot = { quantity: number; price: number; at: Date };

export type NetPosition = {
  instrument: string;
  side: Side;
  quantity: number;
  entry: number;
  openedAt: Date;
};

export type RoundTrip = {
  instrument: string;
  /** The side the position was held on, not the side of the fill that closed it. */
  side: Side;
  quantity: number;
  entry: number;
  exit: number;
  pnlCents: number;
  openedAt: Date;
  closedAt: Date;
  tradeDate: string;
};

export type EquityPoint = { at: Date; tradeDate: string; equityCents: number };

export type Ledger = {
  books: Map<string, Lot[]>;
  /** The last price each contract printed in this stream. */
  marks: Map<string, number>;
  trips: RoundTrip[];
  path: EquityPoint[];
  realisedCents: number;
  startingCents: number;
};

const directionOf = (quantity: number) => (quantity < 0 ? -1 : 1);

const openOf = (lots: Lot[], mark: number, pointCents: number) =>
  lots.reduce((total, lot) => {
    const move = (mark - lot.price) * directionOf(lot.quantity);

    return total + valueOfMove(move, Math.abs(lot.quantity), pointCents);
  }, 0);

const unrealisedIn = (books: Map<string, Lot[]>, marks: Map<string, number>) => {
  let total = 0;

  for (const [code, lots] of books) {
    const mark = marks.get(code);

    if (mark !== undefined) {
      total += openOf(lots, mark, pointCentsOf(contractOf(code)));
    }
  }

  return total;
};

/**
 * Lots are matched first in, first out. Netting decides what the account holds,
 * this decides which entry price a close is measured against, and taking a
 * stored price rather than a rolling average keeps every amount a whole cent.
 */
export const ledgerOf = (fills: Fill[], startingCents = 0): Ledger => {
  const books = new Map<string, Lot[]>();
  const marks = new Map<string, number>();
  const trips: RoundTrip[] = [];
  const path: EquityPoint[] = [];
  let realisedCents = 0;

  const ordered = [...fills].sort((a, b) => a.at.getTime() - b.at.getTime());

  for (const fill of ordered) {
    const pointCents = pointCentsOf(contractOf(fill.instrument));
    const lots = books.get(fill.instrument) ?? [];
    let open = fill.side === "buy" ? fill.quantity : -fill.quantity;

    while (open !== 0 && lots.length > 0 && directionOf(lots[0].quantity) !== directionOf(open)) {
      const lot = lots[0];
      const held = directionOf(lot.quantity);
      const closed = Math.min(Math.abs(lot.quantity), Math.abs(open));
      const pnlCents = valueOfMove((fill.price - lot.price) * held, closed, pointCents);

      realisedCents += pnlCents;
      trips.push({
        instrument: fill.instrument,
        side: held > 0 ? "buy" : "sell",
        quantity: closed,
        entry: lot.price,
        exit: fill.price,
        pnlCents,
        openedAt: lot.at,
        closedAt: fill.at,
        tradeDate: fill.tradeDate,
      });

      lot.quantity -= held * closed;
      open += held * closed;

      if (lot.quantity === 0) {
        lots.shift();
      }
    }

    if (open !== 0) {
      lots.push({ quantity: open, price: fill.price, at: fill.at });
    }

    books.set(fill.instrument, lots);
    marks.set(fill.instrument, fill.price);

    path.push({
      at: fill.at,
      tradeDate: fill.tradeDate,
      equityCents: startingCents + realisedCents + unrealisedIn(books, marks),
    });
  }

  return { books, marks, trips, path, realisedCents, startingCents };
};

/**
 * Where the previous session left the equity, which is what the next one opens
 * on. Taking where the account stands now instead lets a position carried
 * across the roll move the floor under itself.
 */
export const carriedInOf = (ledger: Ledger, tradeDate: string) => {
  const earlier = ledger.path.filter((point) => point.tradeDate < tradeDate);

  return earlier.at(-1)?.equityCents ?? ledger.startingCents;
};

export const balanceOf = (ledger: Ledger) => ledger.startingCents + ledger.realisedCents;

/** Marks given here win, and a contract left out falls back to its last print. */
export const unrealisedOf = (ledger: Ledger, marks?: Map<string, number>) =>
  unrealisedIn(ledger.books, new Map([...ledger.marks, ...(marks ?? [])]));

export const equityOf = (ledger: Ledger, marks?: Map<string, number>) =>
  balanceOf(ledger) + unrealisedOf(ledger, marks);

/** Seeded with the opening balance, so an account that only lost still has a peak. */
export const peakOf = (ledger: Ledger) =>
  ledger.path.reduce((peak, point) => Math.max(peak, point.equityCents), ledger.startingCents);

export const positionsOf = (ledger: Ledger): NetPosition[] => {
  const positions: NetPosition[] = [];

  for (const [instrument, lots] of ledger.books) {
    if (lots.length === 0) {
      continue;
    }

    const quantity = lots.reduce((total, lot) => total + Math.abs(lot.quantity), 0);
    const cost = lots.reduce((total, lot) => total + Math.abs(lot.quantity) * lot.price, 0);

    positions.push({
      instrument,
      side: directionOf(lots[0].quantity) > 0 ? "buy" : "sell",
      quantity,
      // Display only. Every amount is measured against the lot it came from.
      entry: Math.round(cost / quantity),
      openedAt: lots[0].at,
    });
  }

  return positions;
};
