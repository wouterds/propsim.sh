import { index, json, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

import { UUIDv7, uuid } from "./types/uuid";

export type EmailLog = typeof emailLogs.$inferSelect;
export type EmailLogInsert = typeof emailLogs.$inferInsert;

export const emailLogs = mysqlTable(
  "email_logs",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => UUIDv7()),
    recipient: varchar("recipient", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    template: varchar("template", { length: 32 }).notNull(),
    // Codes and tokens are redacted on the way in, and the whole column is
    // emptied when the account is deleted.
    payload: json("payload"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  // The address is what a scrub matches on.
  (table) => [index("recipient_idx").on(table.recipient)],
);
