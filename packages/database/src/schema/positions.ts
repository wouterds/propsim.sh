import { relations, sql } from "drizzle-orm";
import { int, mysqlEnum, mysqlTable, timestamp, unique } from "drizzle-orm/mysql-core";

import { instruments } from "./instruments";
import { orders } from "./orders";
import { tradingSessions } from "./trading-sessions";
import { instant } from "./types/instant";
import { multiplier, price } from "./types/money";
import { UUIDv7, uuid } from "./types/uuid";

export type Position = typeof positions.$inferSelect;
export type PositionInsert = typeof positions.$inferInsert;

/** A table rather than a fold over orders: the floor marks it on every bar. */
export const positions = mysqlTable(
  "positions",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => UUIDv7()),
    sessionId: uuid("session_id").notNull(),
    instrumentId: uuid("instrument_id").notNull(),
    // Snapshotted like the session's daily limit: correcting a wrong
    // `instruments.pointValue` must not rewrite P&L already marked against it.
    pointValue: multiplier("point_value").notNull(),
    side: mysqlEnum("side", ["long", "short"]).notNull(),
    quantity: int("quantity").notNull(),
    entryPrice: price("entry_price").notNull(),
    exitPrice: price("exit_price"),
    openedAt: instant("opened_at").notNull(),
    // Open-ness is `closedAt IS NULL`. A status enum would be a second answer.
    closedAt: instant("closed_at"),
    // Null once closed, which is what makes the unique below partial. A second
    // open row is double exposure, and the ratchet would spend trailing room on
    // it that no reset ever returns.
    openInstrumentId: uuid("open_instrument_id").generatedAlwaysAs(
      sql`(case when \`closed_at\` is null then \`instrument_id\` end)`,
      { mode: "stored" },
    ),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    unique("session_id_open_instrument_id_unique").on(table.sessionId, table.openInstrumentId),
  ],
);

export const positionsRelations = relations(positions, ({ one, many }) => ({
  session: one(tradingSessions, {
    fields: [positions.sessionId],
    references: [tradingSessions.id],
  }),
  instrument: one(instruments, {
    fields: [positions.instrumentId],
    references: [instruments.id],
  }),
  orders: many(orders),
}));
