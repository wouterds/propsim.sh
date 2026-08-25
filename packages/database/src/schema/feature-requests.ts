import { index, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

import { UUIDv7, uuid } from "./types/uuid";

export type FeatureRequest = typeof featureRequests.$inferSelect;
export type FeatureRequestInsert = typeof featureRequests.$inferInsert;

export const featureRequests = mysqlTable(
  "feature_requests",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => UUIDv7()),
    userId: uuid("user_id").notNull(),
    title: varchar("title", { length: 120 }).notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [index("user_id_idx").on(table.userId)],
);
