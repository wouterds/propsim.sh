import { relations } from "drizzle-orm";
import { index, int, mysqlEnum, mysqlTable, timestamp, unique } from "drizzle-orm/mysql-core";

import { instruments } from "./instruments";
import { positions } from "./positions";
import { tradingSessions } from "./trading-sessions";
import { instant } from "./types/instant";
import { price } from "./types/money";
import { UUIDv7, uuid } from "./types/uuid";

export type Order = typeof orders.$inferSelect;
export type OrderInsert = typeof orders.$inferInsert;

/**
 * Every intent and every execution, and the fill stream the engine consumes.
 * No separate fills table: this engine fills wholly at one price or rests, so a
 * fill row would be 1:1 with an order forever.
 */
export const orders = mysqlTable(
  "orders",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => UUIDv7()),
    sessionId: uuid("session_id").notNull(),
    positionId: uuid("position_id"),
    instrumentId: uuid("instrument_id").notNull(),
    // Part of the engine's INPUT, not metadata: two orders stamped in the same
    // millisecond replayed the other way round give a different peak, so a
    // different floor, so a different verdict, silently.
    sequence: int("sequence").notNull(),
    side: mysqlEnum("side", ["buy", "sell"]).notNull(),
    type: mysqlEnum("type", ["market", "limit", "stop"]).notNull(),
    // `rejected` is the lockout's only trace. Folded into `cancelled` it is
    // indistinguishable from an order the trader pulled.
    status: mysqlEnum("status", ["working", "filled", "cancelled", "rejected"])
      .notNull()
      .default("working"),
    quantity: int("quantity").notNull(),
    restingPrice: price("resting_price"),
    filledPrice: price("filled_price"),
    placedAt: instant("placed_at").notNull(),
    filledAt: instant("filled_at"),
    // Wall clock, and genuinely not `placedAt`: a replay puts these years apart.
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    unique("session_id_sequence_unique").on(table.sessionId, table.sequence),
    index("position_id_idx").on(table.positionId),
  ],
);

export const ordersRelations = relations(orders, ({ one }) => ({
  session: one(tradingSessions, {
    fields: [orders.sessionId],
    references: [tradingSessions.id],
  }),
  position: one(positions, { fields: [orders.positionId], references: [positions.id] }),
  instrument: one(instruments, { fields: [orders.instrumentId], references: [instruments.id] }),
}));
