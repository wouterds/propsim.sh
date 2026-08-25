import {
  char,
  datetime,
  index,
  mysqlEnum,
  mysqlTable,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";

import { UUIDv7, uuid } from "./types/uuid";

export type Session = typeof sessions.$inferSelect;
export type SessionInsert = typeof sessions.$inferInsert;

export const sessions = mysqlTable(
  "sessions",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => UUIDv7()),
    userId: uuid("user_id").notNull(),
    // A hash of the cookie token, never the token. A database dump then hands
    // over no working session.
    hash: varchar("hash", { length: 64 }).notNull(),
    // Descriptive only. Which session this is comes from the cookie, so a
    // browser update rewrites these fields rather than making a second row.
    userAgent: varchar("user_agent", { length: 512 }),
    browser: varchar("browser", { length: 32 }),
    os: varchar("os", { length: 32 }),
    kind: varchar("kind", { length: 16 }),
    ip: varchar("ip", { length: 45 }),
    country: char("country", { length: 2 }),
    lastSeenAt: datetime("last_seen_at").notNull(),
    expiresAt: datetime("expires_at").notNull(),
    revokedAt: datetime("revoked_at"),
    // Kept so the reason a session ended can be told to the person it belonged
    // to, and so an incident can be read back later.
    revokedReason: mysqlEnum("revoked_reason", [
      "logout",
      "revoked",
      "password_change",
      "password_reset",
      "email_change",
    ]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [unique("hash_unique").on(table.hash), index("user_id_idx").on(table.userId)],
);
