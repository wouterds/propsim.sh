import { index, mysqlEnum, mysqlTable, timestamp, unique } from "drizzle-orm/mysql-core";

import { UUIDv7, uuid } from "./types/uuid";

export const VOTE_SUBJECTS = ["request", "comment"] as const;

export type VoteSubject = (typeof VOTE_SUBJECTS)[number];

export type FeatureVote = typeof featureVotes.$inferSelect;
export type FeatureVoteInsert = typeof featureVotes.$inferInsert;

// One table for both, because a vote is the same row either way: who, on what.
export const featureVotes = mysqlTable(
  "feature_votes",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => UUIDv7()),
    subject: mysqlEnum("subject", VOTE_SUBJECTS).notNull(),
    subjectId: uuid("subject_id").notNull(),
    userId: uuid("user_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    // The triple is what holds one vote per person, and its leading pair is what
    // counts the votes on a thing.
    unique("subject_unique").on(table.subject, table.subjectId, table.userId),
    // Reading back what one person voted on skips that leading pair.
    index("subject_user_idx").on(table.subject, table.userId),
  ],
);
