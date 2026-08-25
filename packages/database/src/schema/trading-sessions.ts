import { relations } from "drizzle-orm";
import { date, mysqlTable, timestamp, unique } from "drizzle-orm/mysql-core";

import { breaches } from "./breaches";
import { orders } from "./orders";
import { positions } from "./positions";
import { tradingAccounts } from "./trading-accounts";
import { instant } from "./types/instant";
import { money } from "./types/money";
import { UUIDv7, uuid } from "./types/uuid";

export type TradingSession = typeof tradingSessions.$inferSelect;
export type TradingSessionInsert = typeof tradingSessions.$inferInsert;

/**
 * One account, one trading day, and the SOFT floor in full. `openBalance` and
 * `dailyLossLimit` are written once at open and never updated, so "the limit
 * does not move during the day" is insert discipline rather than a rule to
 * remember, and the reset is the next row rather than a nightly UPDATE.
 */
export const tradingSessions = mysqlTable(
  "trading_sessions",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => UUIDv7()),
    accountId: uuid("account_id").notNull(),
    // The day's LABEL, not a Date: a CME session opens at 18:00 ET the previous
    // calendar day, so this is not derivable from `openedAt` and carries no zone.
    sessionDate: date("session_date", { mode: "string" }).notNull(),
    openBalance: money("open_balance").notNull(),
    // Snapshot AT OPEN, so editing the account cannot retroactively move the
    // floor a finished session was judged against.
    dailyLossLimit: money("daily_loss_limit").notNull(),
    // INCLUDING unrealised, so no fold over closed trades recovers it.
    lowEquity: money("low_equity").notNull(),
    closeBalance: money("close_balance"),
    openedAt: instant("opened_at").notNull(),
    closedAt: instant("closed_at"),
    // On the session rather than the account, so the lock evaporates when the
    // session rolls instead of needing to be cleared.
    lockedAt: instant("locked_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  // A second row for the same day hands back a fresh `openBalance` and a null
  // `lockedAt`, which is the soft floor reset with an INSERT. A replay repeats
  // the date on its own account, so this stays a plain unique.
  (table) => [unique("account_id_session_date_unique").on(table.accountId, table.sessionDate)],
);

export const tradingSessionsRelations = relations(tradingSessions, ({ one, many }) => ({
  account: one(tradingAccounts, {
    fields: [tradingSessions.accountId],
    references: [tradingAccounts.id],
  }),
  orders: many(orders),
  positions: many(positions),
  breaches: many(breaches),
}));
