import { index, mysqlTable, text, timestamp } from "drizzle-orm/mysql-core";

import { UUIDv7, uuid } from "./types/uuid";

export type FeatureComment = typeof featureComments.$inferSelect;
export type FeatureCommentInsert = typeof featureComments.$inferInsert;

export const featureComments = mysqlTable(
  "feature_comments",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => UUIDv7()),
    featureId: uuid("feature_id").notNull(),
    // Set on a reply, and never on a reply to one. The writer clamps a deeper
    // answer back to the comment it hangs under, so a thread stays two levels.
    parentId: uuid("parent_id"),
    userId: uuid("user_id").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [index("feature_id_idx").on(table.featureId)],
);
