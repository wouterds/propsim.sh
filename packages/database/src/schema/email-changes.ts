import { datetime, mysqlTable, timestamp, unique, varchar } from "drizzle-orm/mysql-core";

import { UUIDv7, uuid } from "./types/uuid";

export type EmailChange = typeof emailChanges.$inferSelect;
export type EmailChangeInsert = typeof emailChanges.$inferInsert;

// Held here until the new address answers, so the account keeps the old one.
export const emailChanges = mysqlTable(
  "email_changes",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => UUIDv7()),
    userId: uuid("user_id").notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    hash: varchar("hash", { length: 64 }).notNull(),
    expiresAt: datetime("expires_at").notNull(),
    consumedAt: datetime("consumed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [unique("hash_unique").on(table.hash), unique("user_id_unique").on(table.userId)],
);
