import { fills, getDb, type Tx } from "@propsim/database";
import { type Side, tradeDateOf } from "@propsim/engine";
import { feeOf } from "@propsim/plans";
import { asc, eq } from "drizzle-orm";

export type FillWrite = {
  accountId: string;
  orderId: string;
  instrument: string;
  side: Side;
  quantity: number;
  /** Price units, see PRICE_SCALE. */
  price: number;
  at: Date;
};

/**
 * The one place a fill row is built, so the web app and the matcher cannot
 * disagree about what a fill is. The session it printed under is cut from the
 * instant it printed at, never from the clock of whatever wrote it, and the
 * commission is worked out here so no caller can write a free one.
 */
export const writeFill = (tx: Tx, fill: FillWrite) =>
  tx.insert(fills).values({
    ...fill,
    tradeDate: tradeDateOf(fill.at),
    feeCents: feeOf(fill.instrument, fill.quantity),
  });

/** The stream everything monetary is folded from, oldest print first. */
export const listFills = (accountId: string) =>
  getDb()
    .select()
    .from(fills)
    .where(eq(fills.accountId, accountId))
    // UUIDv7 breaks the tie, so two fills in the same millisecond keep their order.
    .orderBy(asc(fills.at), asc(fills.id));
