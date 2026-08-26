import type { Side } from "./fills";
import { priceUnits } from "./money";

/**
 * Structural on purpose. A Yahoo candle, a stored bar and a literal in a spec
 * all satisfy it, so nothing here can tell which one it was given.
 */
export type Bar = {
  /** Bar open, in milliseconds. */
  time: number;
  open: number;
  high: number;
  low: number;
};

export type Resting = {
  id: string;
  side: Side;
  type: "limit" | "stop";
  intent: "trade" | "stop_loss" | "take_profit";
  /** Price units, see PRICE_SCALE. */
  price: number;
  placedAt: Date;
  parentOrderId: string | null;
  /** Null while the order that opens the position is still working. */
  parentFilledAt: Date | null;
};

export type Match<T extends Resting> = {
  order: T;
  /** Price units. */
  price: number;
  at: Date;
};

/** Buy limits and sell stops wait below the price, sell limits and buy stops above. */
const fallsTo = (order: Resting) => (order.side === "buy") === (order.type === "limit");

/**
 * A stop fills where price traded, a limit only where price traded through it.
 * A touch proves a trade happened at that price, not that it happened behind
 * the queue already resting there.
 *
 * A bar that opens past the price fills at the open: price improvement on a
 * limit, slippage on a stop, which is what a gap does to each.
 */
export const fillPriceOf = (order: Resting, bar: Bar): number | null => {
  const open = priceUnits(bar.open);

  if (fallsTo(order)) {
    const low = priceUnits(bar.low);
    const reached = order.type === "stop" ? low <= order.price : low < order.price;

    return reached ? Math.min(order.price, open) : null;
  }

  const high = priceUnits(bar.high);
  const reached = order.type === "stop" ? high >= order.price : high > order.price;

  return reached ? Math.max(order.price, open) : null;
};

/**
 * A bar does not say whether its high or its low came first, so where one bar
 * reaches two of an account's orders the adverse one is taken to have printed
 * first: the entry before the bracket it carries, and the stop before the
 * target. Every other reading of the same bar is kinder to the trader.
 */
const rankOf = (order: Resting) => {
  if (order.parentOrderId === null) return 0;

  return order.intent === "stop_loss" ? 1 : 2;
};

/** Null while the order cannot fill at all, or the instant it becomes fillable. */
const liveFrom = (order: Resting, opened: Map<string, number>) => {
  const placed = order.placedAt.getTime();

  if (order.parentOrderId === null) {
    return placed;
  }

  const entry = opened.get(order.parentOrderId);

  // A bracket guards a position. Filling one before its entry opens the
  // position it was meant to close, on the wrong side.
  return entry === undefined ? null : Math.max(placed, entry);
};

/**
 * Every fill the bars produce, oldest first. A bar can only fill an order that
 * was already resting when the bar opened, so an order never fills on price
 * action that printed before the trader placed it.
 *
 * The bar carries no clock inside it, so fills decided on one bar are stamped a
 * millisecond apart. That offset is the only record of the order they were
 * decided in, and the ledger sorts on it.
 */
export const matchesOf = <T extends Resting>(orders: T[], bars: Bar[]): Match<T>[] => {
  const queue = [...orders].sort((a, b) => rankOf(a) - rankOf(b));
  const opened = new Map<string, number>();
  const settled = new Set<string>();
  const matches: Match<T>[] = [];

  for (const order of queue) {
    if (order.parentOrderId !== null && order.parentFilledAt) {
      opened.set(order.parentOrderId, order.parentFilledAt.getTime());
    }
  }

  for (const bar of [...bars].sort((a, b) => a.time - b.time)) {
    let taken = 0;

    for (const order of queue) {
      const from = liveFrom(order, opened);

      if (settled.has(order.id) || from === null || bar.time < from) {
        continue;
      }

      const price = fillPriceOf(order, bar);

      if (price === null) {
        continue;
      }

      matches.push({ order, price, at: new Date(bar.time + taken) });
      taken += 1;
      settled.add(order.id);
      opened.set(order.id, bar.time);

      // One of a bracket fills and the other is spent, on this bar and after it.
      if (order.parentOrderId !== null) {
        for (const sibling of queue) {
          if (sibling.parentOrderId === order.parentOrderId) {
            settled.add(sibling.id);
          }
        }
      }
    }
  }

  return matches;
};
