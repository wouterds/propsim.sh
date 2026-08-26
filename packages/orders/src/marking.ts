import { type Account, accounts, fills, getDb, orders, UUIDv7, users } from "@propsim/database";
import { type NetPosition, tradeDateOf } from "@propsim/engine";
import { and, eq, getTableColumns, isNull } from "drizzle-orm";
import { writeFill } from "./fills";

/**
 * Every account a floor can still be crossed in: live, still owned, and with
 * prints to fold. One that never traded holds nothing for the tape to move.
 */
export const listLive = (): Promise<Account[]> =>
  getDb()
    .selectDistinct(getTableColumns(accounts))
    .from(accounts)
    .innerJoin(users, eq(users.id, accounts.userId))
    .innerJoin(fills, eq(fills.accountId, accounts.id))
    .where(and(isNull(accounts.endedAt), isNull(users.deletedAt)));

/**
 * The account is finished, so what it holds is closed at the marks given and
 * what it was working is cancelled. A fill has to point at an order, so each
 * position gets one written for it.
 *
 * Leaving the position open instead would keep an ended account marking to a
 * tape it can no longer trade, and its last session would never close.
 */
export const flatten = (
  accountId: string,
  positions: NetPosition[],
  marks: Map<string, number>,
  at: Date,
) =>
  getDb().transaction(async (tx) => {
    const tradeDate = tradeDateOf(at);

    // Before the closing orders go in, or they cancel themselves.
    await tx
      .update(orders)
      .set({ endedAt: at, endedReason: "cancelled" })
      .where(and(eq(orders.accountId, accountId), isNull(orders.endedAt)));

    for (const position of positions) {
      const price = marks.get(position.instrument);

      if (price === undefined) {
        continue;
      }

      const id = UUIDv7();
      const side = position.side === "buy" ? "sell" : "buy";

      await tx.insert(orders).values({
        id,
        accountId,
        tradeDate,
        instrument: position.instrument,
        side,
        type: "market",
        intent: "trade",
        quantity: position.quantity,
        placedAt: at,
      });

      await writeFill(tx, {
        accountId,
        orderId: id,
        instrument: position.instrument,
        side,
        quantity: position.quantity,
        price,
        at,
      });
    }
  });
