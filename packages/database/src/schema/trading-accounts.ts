import { relations } from "drizzle-orm";
import { index, int, mysqlEnum, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

import { tradingSessions } from "./trading-sessions";
import { instant } from "./types/instant";
import { money } from "./types/money";
import { UUIDv7, uuid } from "./types/uuid";
import { users } from "./users";

export type TradingAccount = typeof tradingAccounts.$inferSelect;
export type TradingAccountInsert = typeof tradingAccounts.$inferInsert;

/**
 * One run of one rule set, and the home of the HARD floor's anchor. A replay is
 * a fork of this row rather than another session on it, so re-trading a day
 * cannot ratchet the peak of the account it forked from or kill it.
 */
export const tradingAccounts = mysqlTable(
  "trading_accounts",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => UUIDv7()),
    userId: uuid("user_id").notNull(),
    name: varchar("name", { length: 64 }).notNull(),
    kind: mysqlEnum("kind", ["live", "replay"]).notNull().default("live"),
    replayOfId: uuid("replay_of_id"),
    phase: mysqlEnum("phase", ["evaluation", "funded"]).notNull().default("evaluation"),
    // Three values, not four: `locked` is the daily limit and has a session's
    // lifetime, so it is `tradingSessions.lockedAt`.
    status: mysqlEnum("status", ["active", "breached", "passed"]).notNull().default("active"),
    trailingMode: mysqlEnum("trailing_mode", ["eod", "intraday"]).notNull(),
    startingBalance: money("starting_balance").notNull(),
    balance: money("balance").notNull(),
    // THE RATCHET. Written with a max against its own previous value, never an
    // assignment, and fed by whatever `trailingMode` selects. A peak of +424.50
    // that closes at +264.50 has spent 160.00 of room for good, so nothing here
    // can recompute it.
    peakEquity: money("peak_equity").notNull(),
    peakEquityAt: instant("peak_equity_at").notNull(),
    // In force for the NEXT session. A running one keeps its own snapshot.
    dailyLossLimit: money("daily_loss_limit").notNull(),
    trailingDrawdown: money("trailing_drawdown").notNull(),
    profitTarget: money("profit_target"),
    minimumTradingDays: int("minimum_trading_days"),
    breachedAt: instant("breached_at"),
    passedAt: instant("passed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    index("user_id_idx").on(table.userId),
    index("replay_of_id_idx").on(table.replayOfId),
  ],
);

export const tradingAccountsRelations = relations(tradingAccounts, ({ one, many }) => ({
  user: one(users, { fields: [tradingAccounts.userId], references: [users.id] }),
  replayOf: one(tradingAccounts, {
    fields: [tradingAccounts.replayOfId],
    references: [tradingAccounts.id],
    relationName: "replays",
  }),
  replays: many(tradingAccounts, { relationName: "replays" }),
  sessions: many(tradingSessions),
}));
