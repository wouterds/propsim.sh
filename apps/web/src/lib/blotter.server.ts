import type { Fill as FillRow, Order as OrderRow } from "@propsim/database";
import { isWorking, type Ledger, positionsOf, statusOf, toPrice } from "@propsim/engine";
import type { Order, Position } from "~/components/trading/trading-state";

const takenOn = (fills: FillRow[], orderId: string) =>
  fills.filter((fill) => fill.orderId === orderId);

/** A market order has no price of its own until a fill gives it one. */
const priceOf = (row: OrderRow, taken: FillRow[]) => {
  if (row.price !== null) {
    return toPrice(row.price);
  }

  const quantity = taken.reduce((total, fill) => total + fill.quantity, 0);
  const cost = taken.reduce((total, fill) => total + fill.quantity * fill.price, 0);

  return quantity === 0 ? 0 : toPrice(cost / quantity);
};

export const ordersOf = (rows: OrderRow[], fills: FillRow[]): Order[] =>
  rows.map((row) => {
    const taken = takenOn(fills, row.id);
    const filled = taken.reduce((total, fill) => total + fill.quantity, 0);

    return {
      id: row.id,
      placedAt: row.placedAt.getTime(),
      side: row.side,
      type: row.type,
      quantity: row.quantity,
      price: priceOf(row, taken),
      status: statusOf(row, filled),
    };
  });

/**
 * The bracket shown is the outer pair: the stop that would leave the most on
 * the table and the target that would take the most off it. Every working order
 * is drawn in its own right as well, so the pick hides nothing.
 */
const outermost = (prices: number[], entry: number) => {
  if (prices.length === 0) {
    return null;
  }

  return prices.reduce((far, price) =>
    Math.abs(price - entry) > Math.abs(far - entry) ? price : far,
  );
};

const guardsOn = (rows: OrderRow[], fills: FillRow[], instrument: string) =>
  rows.flatMap((row) => {
    const filled = takenOn(fills, row.id).reduce((total, fill) => total + fill.quantity, 0);
    const guards = row.instrument === instrument && row.intent !== "trade";

    if (!guards || row.price === null || !isWorking(statusOf(row, filled))) {
      return [];
    }

    return [{ intent: row.intent, price: toPrice(row.price) }];
  });

export const positionsIn = (ledger: Ledger, rows: OrderRow[], fills: FillRow[]): Position[] =>
  positionsOf(ledger).map((position) => {
    const entry = toPrice(position.entry);
    const guards = guardsOn(rows, fills, position.instrument);
    const priced = (intent: OrderRow["intent"]) =>
      guards.filter((guard) => guard.intent === intent).map((guard) => guard.price);

    return {
      id: position.instrument,
      openedAt: position.openedAt.getTime(),
      side: position.side,
      quantity: position.quantity,
      entry,
      stopLoss: outermost(priced("stop_loss"), entry),
      takeProfit: outermost(priced("take_profit"), entry),
    };
  });
