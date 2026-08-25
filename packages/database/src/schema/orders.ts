import {
  bigint,
  date,
  datetime,
  index,
  mysqlEnum,
  mysqlTable,
  smallint,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

import { UUIDv7, uuid } from "./types/uuid";

export type Order = typeof orders.$inferSelect;
export type OrderInsert = typeof orders.$inferInsert;

/**
 * Intent, never state. A modify writes a new row carrying `replacesOrderId` and
 * ends the old one, so a cancelled or superseded order is still drawable at the
 * price it held, and a fill always points at a row whose price it was taken at.
 */
export const orders = mysqlTable(
  "orders",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => UUIDv7()),
    accountId: uuid("account_id").notNull(),
    tradeDate: date("trade_date", { mode: "string" }).notNull(),
    instrument: varchar("instrument", { length: 16 }).notNull(),
    side: mysqlEnum("side", ["buy", "sell"]).notNull(),
    // How it triggers.
    type: mysqlEnum("type", ["market", "limit", "stop"]).notNull(),
    // What it is for. `trade` is one the trader placed, the other two are the
    // bracket it carried and only ever reduce.
    intent: mysqlEnum("intent", ["trade", "stop_loss", "take_profit"]).notNull(),
    quantity: smallint("quantity", { unsigned: true }).notNull(),
    // Price units, see PRICE_SCALE. Null on a market order, which has no price
    // of its own until it fills.
    price: bigint("price", { mode: "number" }),
    parentOrderId: uuid("parent_order_id"),
    replacesOrderId: uuid("replaces_order_id"),
    placedAt: datetime("placed_at", { fsp: 3 }).notNull(),
    endedAt: datetime("ended_at", { fsp: 3 }),
    endedReason: mysqlEnum("ended_reason", ["cancelled", "replaced", "expired"]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    index("account_id_trade_date_idx").on(table.accountId, table.tradeDate),
    index("parent_order_id_idx").on(table.parentOrderId),
  ],
);
