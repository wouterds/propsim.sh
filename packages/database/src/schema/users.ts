import {
  boolean,
  index,
  mysqlEnum,
  mysqlTable,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";

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
    // Null on an account that only ever signed in with Google. The reset flow
    // is how one gets a password later.
    password: varchar("password", { length: 255 }),
    verifiedEmailAt: timestamp("verified_email_at"),
    // What the board calls them. Null means the generated persona is used, and
    // the column collation is what makes two spellings of one name collide.
    username: varchar("username", { length: 20 }),
    // Handles, never URLs. The site each one belongs to decides how to reach it,
    // so a stored link cannot point somewhere the profile did not mean to.
    twitter: varchar("twitter", { length: 40 }),
    youtube: varchar("youtube", { length: 40 }),
    twitch: varchar("twitch", { length: 40 }),
    // Off until asked for. A profile is public, and which plans somebody runs
    // is a good deal more than the board already says about them.
    showsAccounts: boolean("shows_accounts").notNull().default(false),
    // Set when the account is emptied, by its owner or by the dormancy sweep.
    deletedAt: timestamp("deleted_at"),
    // The last dormancy notice sent, so the sweep does not repeat one every run.
    inactivityNotice: mysqlEnum("inactivity_notice", ["warn", "final"]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    unique("email_unique").on(table.email),
    unique("username_unique").on(table.username),
    // Every lookup and the dormancy sweep read live rows only.
    index("deleted_at_idx").on(table.deletedAt),
  ],
);
