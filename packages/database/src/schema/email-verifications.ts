import { datetime, mysqlTable, tinyint, unique, varchar } from "drizzle-orm/mysql-core";

import { UUIDv7, uuid } from "./types/uuid";
import { users } from "./users";

export type EmailVerification = typeof emailVerifications.$inferSelect;
export type EmailVerificationInsert = typeof emailVerifications.$inferInsert;

// Every time here is UTC and written by the application. NOW() reads the session time zone.
export const emailVerifications = mysqlTable(
  "email_verifications",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => UUIDv7()),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // The code has 10^6 values. Offline enumeration beats any password hash.
    // Store an HMAC keyed by a secret the database never holds.
    codeHash: varchar("code_hash", { length: 255 }).notNull(),
    attempts: tinyint("attempts", { unsigned: true }).notNull().default(0),
    expiresAt: datetime("expires_at").notNull(),
    consumedAt: datetime("consumed_at"),
    createdAt: datetime("created_at")
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    // One live code per user. A second row would double the guess budget `attempts` caps.
    unique("user_id_unique").on(table.userId),
  ],
);
