import { relations } from "drizzle-orm";
import { mysqlEnum, mysqlTable, timestamp, unique } from "drizzle-orm/mysql-core";

import { tradingSessions } from "./trading-sessions";
import { instant } from "./types/instant";
import { money } from "./types/money";
import { UUIDv7, uuid } from "./types/uuid";

export type Breach = typeof breaches.$inferSelect;
export type BreachInsert = typeof breaches.$inferInsert;

/**
 * The evidence a floor was reached. Append only, hence no `updatedAt`: a
 * corrected breach would contradict a peak already ratcheted off it.
 */
export const breaches = mysqlTable(
  "breaches",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => UUIDv7()),
    sessionId: uuid("session_id").notNull(),
    // Without this a locked-then-reopened session is indistinguishable after
    // the fact from a permanently dead account.
    floor: mysqlEnum("floor", ["daily", "trailing"]).notNull(),
    equity: money("equity").notNull(),
    // Open balance for `daily`, peak equity for `trailing`. The floor is this
    // minus the limit, so it is not stored either.
    measuredFrom: money("measured_from").notNull(),
    limitAmount: money("limit_amount").notNull(),
    // Load-bearing: non-zero proves the crossing happened with no fill at all.
    unrealisedPnl: money("unrealised_pnl").notNull(),
    occurredAt: instant("occurred_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  // Makes a re-run idempotent instead of double-recording.
  (table) => [unique("session_id_floor_unique").on(table.sessionId, table.floor)],
);

export const breachesRelations = relations(breaches, ({ one }) => ({
  session: one(tradingSessions, {
    fields: [breaches.sessionId],
    references: [tradingSessions.id],
  }),
}));
