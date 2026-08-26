import { accounts, fills, getDb, orders, users } from "@propsim/database";
import type { Match, Resting } from "@propsim/engine";
import { and, eq, isNull, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { writeFill } from "./fills";

/** The rule reads none of these three, and a fill cannot be written without them. */
export type RestingOrder = Resting & { accountId: string; instrument: string; quantity: number };

/**
 * Every order a bar could still fill. A closed account keeps the orders it was
 * holding, and none of them may print again. Nor may an emptied account: the
 * person is gone, so nothing may go on trading in their name.
 */
export const listResting = async (): Promise<RestingOrder[]> => {
  const entries = alias(fills, "entry_fills");

  const rows = await getDb()
    .select({
      id: orders.id,
      accountId: orders.accountId,
      instrument: orders.instrument,
      side: orders.side,
      type: orders.type,
      intent: orders.intent,
      quantity: orders.quantity,
      price: orders.price,
      placedAt: orders.placedAt,
      parentOrderId: orders.parentOrderId,
      parentFilledAt: entries.at,
    })
    .from(orders)
    .innerJoin(accounts, eq(accounts.id, orders.accountId))
    .innerJoin(users, eq(users.id, accounts.userId))
    .leftJoin(fills, eq(fills.orderId, orders.id))
    .leftJoin(entries, eq(entries.orderId, orders.parentOrderId))
    .where(
      and(
        isNull(orders.endedAt),
        isNull(accounts.endedAt),
        isNull(users.deletedAt),
        // The status of an order is what its fills say. One that has printed is
        // finished whether or not anything marked the row.
        isNull(fills.id),
        ne(orders.type, "market"),
      ),
    );

  return rows.flatMap((row) => {
    if (row.type === "market" || row.price === null) {
      return [];
    }

    return [{ ...row, type: row.type, price: row.price }];
  });
};

/**
 * One fill, and the sibling that guarded the same position goes with it. Two
 * things can race this, and they need different answers. A trader cancelling
 * the order is caught by the locked re-read, because a cancel is a column this
 * can see. A second matcher is not: a fill leaves no mark on the order row, so
 * only the unique key on `order_id` refuses the duplicate.
 */
export const fillResting = ({ order, price, at }: Match<RestingOrder>) =>
  getDb().transaction(async (tx) => {
    // The match was decided from a snapshot taken before the upstream request.
    const [working] = await tx
      .select({ id: orders.id })
      .from(orders)
      .where(and(eq(orders.id, order.id), isNull(orders.endedAt)))
      .limit(1)
      .for("update");

    if (!working) {
      return false;
    }

    await writeFill(tx, {
      accountId: order.accountId,
      orderId: order.id,
      instrument: order.instrument,
      side: order.side,
      quantity: order.quantity,
      price,
      at,
    });

    if (order.parentOrderId !== null) {
      await tx
        .update(orders)
        .set({ endedAt: at, endedReason: "cancelled" })
        .where(
          and(
            eq(orders.accountId, order.accountId),
            eq(orders.parentOrderId, order.parentOrderId),
            ne(orders.id, order.id),
            isNull(orders.endedAt),
          ),
        );
    }

    return true;
  });
