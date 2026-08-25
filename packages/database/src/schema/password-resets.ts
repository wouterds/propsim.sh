import { datetime, mysqlTable, timestamp, unique, varchar } from "drizzle-orm/mysql-core";

import { UUIDv7, uuid } from "./types/uuid";

export type PasswordReset = typeof passwordResets.$inferSelect;
export type PasswordResetInsert = typeof passwordResets.$inferInsert;

// One row per user, so asking again replaces the live token rather than leaving
// two that both open the account.
export const passwordResets = mysqlTable(
  "password_resets",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => UUIDv7()),
    userId: uuid("user_id").notNull(),
    hash: varchar("hash", { length: 64 }).notNull(),
    expiresAt: datetime("expires_at").notNull(),
    consumedAt: datetime("consumed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [unique("hash_unique").on(table.hash), unique("user_id_unique").on(table.userId)],
);
