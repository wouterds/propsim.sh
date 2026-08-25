import { relations } from "drizzle-orm";
import { mysqlTable, timestamp, unique, varchar } from "drizzle-orm/mysql-core";

import { orders } from "./orders";
import { positions } from "./positions";
import { multiplier, price } from "./types/money";
import { UUIDv7, uuid } from "./types/uuid";

export type Instrument = typeof instruments.$inferSelect;
export type InstrumentInsert = typeof instruments.$inferInsert;

/**
 * No tick value column: MNQ is 0.25 x 2.00 = 0.50 a tick and MES is 0.25 x 5.00
 * = 1.25, so a third column is a second place to type the same fact, and a
 * disagreement makes every position wrong by a clean factor with nothing throwing.
 */
export const instruments = mysqlTable(
  "instruments",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => UUIDv7()),
    symbol: varchar("symbol", { length: 16 }).notNull(),
    feedSymbol: varchar("feed_symbol", { length: 32 }).notNull(),
    name: varchar("name", { length: 64 }).notNull(),
    tickSize: price("tick_size").notNull(),
    pointValue: multiplier("point_value").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  // Two rows on one feed symbol are the same contract twice, free to disagree
  // about the point value while both receive the same tape.
  (table) => [
    unique("symbol_unique").on(table.symbol),
    unique("feed_symbol_unique").on(table.feedSymbol),
  ],
);

export const instrumentsRelations = relations(instruments, ({ many }) => ({
  orders: many(orders),
  positions: many(positions),
}));
