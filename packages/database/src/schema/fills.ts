import {
  bigint,
  date,
  datetime,
  index,
  mysqlEnum,
  mysqlTable,
  smallint,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";

import { UUIDv7, uuid } from "./types/uuid";

export type Fill = typeof fills.$inferSelect;
export type FillInsert = typeof fills.$inferInsert;

/**
 * The only source of truth for money. Append only, so there is no `updated_at`:
 * a fill that was wrong is corrected by another fill, never by an edit.
 */
export const fills = mysqlTable(
  "fills",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => UUIDv7()),
    accountId: uuid("account_id").notNull(),
    orderId: uuid("order_id").notNull(),
    // Stamped from `at` on the way in. The session boundary a trade printed
    // under is a fact of that trade, not a function of today's constants.
    tradeDate: date("trade_date", { mode: "string" }).notNull(),
    instrument: varchar("instrument", { length: 16 }).notNull(),
    side: mysqlEnum("side", ["buy", "sell"]).notNull(),
    quantity: smallint("quantity", { unsigned: true }).notNull(),
    // Price units, see PRICE_SCALE.
    price: bigint("price", { mode: "number" }).notNull(),
    at: datetime("at", { fsp: 3 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("account_id_at_idx").on(table.accountId, table.at),
    index("account_id_trade_date_idx").on(table.accountId, table.tradeDate),
    // One fill per order. This is what makes a second matcher, or one restarted
    // mid write, a duplicate key rather than a doubled position.
    unique("order_id_unique").on(table.orderId),
  ],
);
