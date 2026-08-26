import {
  bigint,
  date,
  index,
  mysqlEnum,
  mysqlTable,
  smallint,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

import { UUIDv7, uuid } from "./types/uuid";

export type Account = typeof accounts.$inferSelect;
export type AccountInsert = typeof accounts.$inferInsert;

/**
 * The plan terms are copied here, not read from the catalog. An edit to a plan
 * must not re-judge an account that already traded under the old numbers.
 */
export const accounts = mysqlTable(
  "accounts",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => UUIDv7()),
    userId: uuid("user_id").notNull(),
    // Provenance and a label. Nothing is measured from it.
    planId: varchar("plan_id", { length: 64 }).notNull(),
    name: varchar("name", { length: 64 }).notNull(),
    openedOn: date("opened_on", { mode: "string" }).notNull(),
    startingBalanceCents: bigint("starting_balance_cents", { mode: "number" }).notNull(),
    profitTargetCents: bigint("profit_target_cents", { mode: "number" }).notNull(),
    trailingDrawdownCents: bigint("trailing_drawdown_cents", { mode: "number" }).notNull(),
    dailyLossLimitCents: bigint("daily_loss_limit_cents", { mode: "number" }).notNull(),
    lockAboveStartCents: bigint("lock_above_start_cents", { mode: "number" }).notNull(),
    maxMinis: smallint("max_minis", { unsigned: true }).notNull(),
    maxMicros: smallint("max_micros", { unsigned: true }).notNull(),
    // A high water mark. Folding the fills again can only ever propose a lower
    // one, so this value wins and the trailing floor cannot be handed back.
    peakEquityCents: bigint("peak_equity_cents", { mode: "number" }).notNull(),
    endedAt: timestamp("ended_at"),
    // `daily_loss` is history. The daily floor shuts the session and leaves the
    // account alone, so nothing writes it any more.
    endedReason: mysqlEnum("ended_reason", [
      "daily_loss",
      "trailing_drawdown",
      "news",
      "target_met",
    ]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [index("user_id_idx").on(table.userId)],
);
