import { datetime, mysqlTable, timestamp, tinyint, unique, varchar } from "drizzle-orm/mysql-core";

import { UUIDv7, uuid } from "./types/uuid";
import { users } from "./users";

export type EmailVerification = typeof emailVerifications.$inferSelect;
export type EmailVerificationInsert = typeof emailVerifications.$inferInsert;

export const emailVerifications = mysqlTable(
  "email_verifications",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => UUIDv7()),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    hash: varchar("hash", { length: 255 }).notNull(),
    attempts: tinyint("attempts", { unsigned: true }).notNull().default(0),
    expiresAt: datetime("expires_at").notNull(),
    consumedAt: datetime("consumed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [unique("user_id_unique").on(table.userId)],
);
