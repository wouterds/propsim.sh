import {
  fills as fillsTable,
  getDb,
  type Order as OrderRow,
  orders as ordersTable,
  UUIDv7,
} from "@propsim/database";
import {
  type Fill,
  ledgerOf,
  marketableAt,
  positionsOf,
  type Side,
  tradeDateOf,
} from "@propsim/engine";
import { listFills, lockedFor, settle, writeFill } from "@propsim/orders";
import { and, asc, eq, isNull, ne } from "drizzle-orm";
import type { AccountRow } from "./accounts.server";

type OrderType = OrderRow["type"];

export type Ticket = {
  instrument: string;
  side: Side;
  type: OrderType;
  quantity: number;
  /** Price units. Required on a resting order, unused on a market one. */
  price: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
};

/** The message a refused write hands back, or null when it went through. */
export type Refusal = string | null;

const MAX_QUANTITY = 100;

const opposite = (side: Side): Side => (side === "buy" ? "sell" : "buy");

export const listOrders = (accountId: string) =>
  getDb()
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.accountId, accountId))
    .orderBy(asc(ordersTable.placedAt), asc(ordersTable.id));

const netOf = (fills: Fill[], instrument: string) => {
  const position = positionsOf(ledgerOf(fills)).find((open) => open.instrument === instrument);

  if (!position) {
    return 0;
  }

  return position.side === "buy" ? position.quantity : -position.quantity;
};

/** What the book holds, signed on the contract the ticket names and summed over the rest. */
export type Book = { held: number; elsewhere: number };

const bookOf = (fills: Fill[], instrument: string): Book => ({
  held: netOf(fills, instrument),
  elsewhere: positionsOf(ledgerOf(fills))
    .filter((open) => open.instrument !== instrument)
    .reduce((total, open) => total + open.quantity, 0),
});

export const refuseTicket = (
  row: Pick<AccountRow, "endedAt" | "maxMicros">,
  ticket: Ticket,
  book: Book,
  locked: boolean,
): Refusal => {
  if (row.endedAt) {
    return "This account is closed. Open a new one to keep trading.";
  }

  if (!Number.isInteger(ticket.quantity) || ticket.quantity < 1) {
    return "A ticket needs at least one contract.";
  }

  if (ticket.quantity > MAX_QUANTITY) {
    return `One ticket is capped at ${MAX_QUANTITY} contracts.`;
  }

  if (ticket.type !== "market" && ticket.price === null) {
    return "A resting order needs a price to rest at.";
  }

  const signed = ticket.side === "buy" ? ticket.quantity : -ticket.quantity;
  const after = Math.abs(book.held + signed);
  // Only ever less of what is already held. A flip through zero opens a position.
  const reduces =
    Math.sign(signed) === -Math.sign(book.held) && Math.abs(signed) <= Math.abs(book.held);

  // A shut session takes nothing new. Closing stays open to the trader, because
  // refusing it traps them in the trade that shut them.
  if (locked && !reduces) {
    return "This session hit the daily loss limit. You can still close what is open.";
  }

  // One cap over every contract held, not one per contract.
  if (after + book.elsewhere > row.maxMicros) {
    return `This plan holds at most ${row.maxMicros} micros at once, across every contract.`;
  }

  return null;
};

/**
 * A market order fills at the mark the server read, never at a price the form
 * carried. A resting one is written and left alone: nothing here watches the
 * tape. The stop and the target are written as working orders either way, so a
 * bracket outlives the ticket that asked for it.
 */
export const placeOrder = async (
  row: AccountRow,
  ticket: Ticket,
  mark: number,
  at: Date,
): Promise<Refusal> => {
  const fills = await listFills(row.id);
  const refusal = refuseTicket(
    row,
    ticket,
    bookOf(fills, ticket.instrument),
    await lockedFor(row, at),
  );

  if (refusal) {
    return refusal;
  }

  const tradeDate = tradeDateOf(at);
  const id = UUIDv7();
  const shared = {
    accountId: row.id,
    tradeDate,
    instrument: ticket.instrument,
    quantity: ticket.quantity,
    placedAt: at,
    parentOrderId: id,
  };

  const brackets = [
    ticket.stopLoss === null
      ? null
      : {
          ...shared,
          side: opposite(ticket.side),
          type: "stop" as const,
          intent: "stop_loss" as const,
          price: ticket.stopLoss,
        },
    ticket.takeProfit === null
      ? null
      : {
          ...shared,
          side: opposite(ticket.side),
          type: "limit" as const,
          intent: "take_profit" as const,
          price: ticket.takeProfit,
        },
  ].filter((bracket) => bracket !== null);

  await getDb().transaction(async (tx) => {
    await tx.insert(ordersTable).values({
      ...shared,
      id,
      parentOrderId: null,
      side: ticket.side,
      type: ticket.type,
      intent: "trade",
      price: ticket.type === "market" ? null : ticket.price,
    });

    // A market order, and a resting one priced where the tape already is. The
    // sweep would take the second a few seconds later, which leaves the trader
    // watching an order rest at a level the price has gone by.
    const resting =
      ticket.type === "market" || ticket.price === null
        ? null
        : marketableAt({ side: ticket.side, type: ticket.type, price: ticket.price }, mark);
    const taken = ticket.type === "market" ? mark : resting;

    if (taken !== null) {
      await writeFill(tx, {
        accountId: row.id,
        orderId: id,
        instrument: ticket.instrument,
        side: ticket.side,
        quantity: ticket.quantity,
        price: taken,
        at,
      });
    }

    if (brackets.length > 0) {
      await tx.insert(ordersTable).values(brackets);
    }
  });

  await settle(row.id, at);

  return null;
};

const stillWorking = (accountId: string, id: string) =>
  and(eq(ordersTable.id, id), eq(ordersTable.accountId, accountId), isNull(ordersTable.endedAt));

/** Children go with it, or a stop is left resting for a position nobody has. */
export const cancelOrder = async (accountId: string, id: string, at: Date) => {
  const ended = { endedAt: at, endedReason: "cancelled" as const };

  await getDb().transaction(async (tx) => {
    const [working] = await tx
      .select({ id: ordersTable.id })
      .from(ordersTable)
      .where(stillWorking(accountId, id))
      .limit(1)
      .for("update");

    if (!working) {
      return;
    }

    // A fill leaves no mark on the order row. Without this a cancel that lost
    // the race to the matcher would end the brackets guarding a live position.
    const [printed] = await tx
      .select({ id: fillsTable.id })
      .from(fillsTable)
      .where(eq(fillsTable.orderId, id))
      .limit(1);

    if (printed) {
      return;
    }

    await tx.update(ordersTable).set(ended).where(stillWorking(accountId, id));

    await tx
      .update(ordersTable)
      .set(ended)
      .where(
        and(
          eq(ordersTable.accountId, accountId),
          eq(ordersTable.parentOrderId, id),
          isNull(ordersTable.endedAt),
        ),
      );
  });
};

/**
 * A new row supersedes the old one rather than editing it, so the order that
 * was replaced is still drawable at the price it carried, and every fill still
 * points at a row whose price it was taken at.
 */
export const modifyOrder = async (
  accountId: string,
  id: string,
  price: number,
  quantity: number,
  at: Date,
  /** Null on a quiet feed, which leaves the replacement for the sweep. */
  mark: number | null,
): Promise<Refusal> => {
  const [order] = await getDb()
    .select()
    .from(ordersTable)
    .where(stillWorking(accountId, id))
    .limit(1);

  if (!order) {
    return "That order is no longer working.";
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    return "A ticket needs between one and a hundred contracts.";
  }

  const replacementId = UUIDv7();

  await getDb().transaction(async (tx) => {
    await tx.insert(ordersTable).values({
      id: replacementId,
      accountId: order.accountId,
      tradeDate: order.tradeDate,
      instrument: order.instrument,
      side: order.side,
      type: order.type,
      intent: order.intent,
      quantity,
      price,
      parentOrderId: order.parentOrderId,
      replacesOrderId: order.id,
      placedAt: at,
    });

    await tx
      .update(ordersTable)
      .set({ endedAt: at, endedReason: "replaced" })
      .where(eq(ordersTable.id, order.id));

    await tx
      .update(ordersTable)
      .set({ parentOrderId: replacementId })
      .where(and(eq(ordersTable.parentOrderId, order.id), isNull(ordersTable.endedAt)));

    // Moved onto a level the tape has already passed, so it is taken here
    // rather than a few seconds later by the sweep. A bracket is left alone:
    // it may only ever print behind the position it guards.
    const taken =
      mark === null || order.parentOrderId !== null || order.type === "market"
        ? null
        : marketableAt({ side: order.side, type: order.type, price }, mark);

    if (taken !== null) {
      await writeFill(tx, {
        accountId: order.accountId,
        orderId: replacementId,
        instrument: order.instrument,
        side: order.side,
        quantity,
        price: taken,
        at,
      });
    }
  });

  await settle(accountId, at);

  return null;
};

/** One fill against the net position, and the bracket that guarded it goes too. */
export const closePosition = async (
  row: AccountRow,
  instrument: string,
  mark: number,
  at: Date,
): Promise<Refusal> => {
  const fills = await listFills(row.id);
  const held = netOf(fills, instrument);

  if (held === 0) {
    return "Nothing open on that contract.";
  }

  const tradeDate = tradeDateOf(at);
  const side = held > 0 ? "sell" : "buy";
  const id = UUIDv7();

  await getDb().transaction(async (tx) => {
    await tx.insert(ordersTable).values({
      id,
      accountId: row.id,
      tradeDate,
      instrument,
      side,
      type: "market",
      intent: "trade",
      quantity: Math.abs(held),
      placedAt: at,
    });

    await writeFill(tx, {
      accountId: row.id,
      orderId: id,
      instrument,
      side,
      quantity: Math.abs(held),
      price: mark,
      at,
    });

    // Only the brackets. A resting entry the trader left is still theirs.
    await tx
      .update(ordersTable)
      .set({ endedAt: at, endedReason: "cancelled" })
      .where(
        and(
          eq(ordersTable.accountId, row.id),
          eq(ordersTable.instrument, instrument),
          ne(ordersTable.intent, "trade"),
          isNull(ordersTable.endedAt),
        ),
      );
  });

  await settle(row.id, at);

  return null;
};
