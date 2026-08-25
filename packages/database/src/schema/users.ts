import { datetime, mysqlTable, timestamp, unique, varchar } from "drizzle-orm/mysql-core";

import { UUIDv7, uuid } from "./types/uuid";

export type User = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;

export const users = mysqlTable(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => UUIDv7()),
    email: varchar("email", { length: 255 }).notNull(),
    password: varchar("password", { length: 255 }).notNull(),
    // datetime, not timestamp. The first TIMESTAMP column takes DEFAULT CURRENT_TIMESTAMP
    // when explicit_defaults_for_timestamp is off, which marks every user verified.
    emailVerifiedAt: datetime("email_verified_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [unique("email_unique").on(table.email)],
);
