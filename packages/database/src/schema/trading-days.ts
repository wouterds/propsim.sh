import { bigint, date, datetime, mysqlTable, timestamp, unique } from "drizzle-orm/mysql-core";

import { UUIDv7, uuid } from "./types/uuid";

export type TradingDay = typeof tradingDays.$inferSelect;
export type TradingDayInsert = typeof tradingDays.$inferInsert;

/**
 * One row per session, cut at 17:00 CT. It holds the two numbers the fills
 * cannot give back: the equity the session opened on, and its low water mark.
 */
export const tradingDays = mysqlTable(
  "trading_days",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => UUIDv7()),
    accountId: uuid("account_id").notNull(),
    tradeDate: date("trade_date", { mode: "string" }).notNull(),
    openedAt: datetime("opened_at", { fsp: 3 }).notNull(),
    // Stamped once, from the equity at the moment the session was first touched.
    openEquityCents: bigint("open_equity_cents", { mode: "number" }).notNull(),
    // A low water mark, so a dip that no later fill records still counts.
    lowEquityCents: bigint("low_equity_cents", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [unique("account_id_trade_date_unique").on(table.accountId, table.tradeDate)],
);
