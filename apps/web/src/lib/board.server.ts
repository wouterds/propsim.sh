import type { VoteSubject } from "@propsim/database";
import { featureComments, featureRequests, featureVotes, getDb, users } from "@propsim/database";
import { personaOf } from "@propsim/identity";
import { and, asc, desc, eq } from "drizzle-orm";
import type { MySqlColumn } from "drizzle-orm/mysql-core";
import { formatAgo } from "./format";

const votesOn = (subject: VoteSubject, subjectId: MySqlColumn) =>
  getDb().$count(
    featureVotes,
    and(eq(featureVotes.subject, subject), eq(featureVotes.subjectId, subjectId)),
  );

/** What one person has already voted on, so their arrows come back filled. */
const votedBy = async (subject: VoteSubject, userId: string | null) => {
  if (!userId) {
    return new Set<string>();
  }

  const rows = await getDb()
    .select({ subjectId: featureVotes.subjectId })
    .from(featureVotes)
    .where(and(eq(featureVotes.subject, subject), eq(featureVotes.userId, userId)));

  return new Set(rows.map((row) => row.subjectId));
};

export const listFeatures = async (userId: string | null) => {
  const rows = await getDb()
    .select({
      id: featureRequests.id,
      title: featureRequests.title,
      votes: votesOn("request", featureRequests.id),
      comments: getDb().$count(featureComments, eq(featureComments.featureId, featureRequests.id)),
    })
    .from(featureRequests)
    // The count again rather than its name. Drizzle leaves a counted column
    // unaliased, so an order by that reads back "votes" finds no such column.
    .orderBy(desc(votesOn("request", featureRequests.id)), desc(featureRequests.createdAt));

  const mine = await votedBy("request", userId);

  return rows.map((row) => ({ ...row, voted: mine.has(row.id) }));
};

export const findFeature = async (id: string, userId: string | null) => {
  const [row] = await getDb()
    .select({
      id: featureRequests.id,
      title: featureRequests.title,
      description: featureRequests.description,
      userId: featureRequests.userId,
      createdAt: featureRequests.createdAt,
      username: users.username,
      votes: votesOn("request", featureRequests.id),
    })
    .from(featureRequests)
    .innerJoin(users, eq(users.id, featureRequests.userId))
    .where(eq(featureRequests.id, id))
    .limit(1);

  if (!row) {
    return null;
  }

  const mine = await votedBy("request", userId);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    author: personaOf(row.userId, row.username),
    since: formatAgo(row.createdAt, new Date()),
    votes: row.votes,
    voted: mine.has(row.id),
  };
};

/**
 * The thread under a request. Loudest first, and a reply carries no count of its
 * own because the page gives it nothing to raise one with.
 */
export const listComments = async (featureId: string, userId: string | null) => {
  const now = new Date();

  const rows = await getDb()
    .select({
      id: featureComments.id,
      parentId: featureComments.parentId,
      userId: featureComments.userId,
      body: featureComments.body,
      createdAt: featureComments.createdAt,
      username: users.username,
      votes: votesOn("comment", featureComments.id),
    })
    .from(featureComments)
    .innerJoin(users, eq(users.id, featureComments.userId))
    .where(eq(featureComments.featureId, featureId))
    .orderBy(asc(featureComments.createdAt));

  const mine = await votedBy("comment", userId);

  const said = (row: (typeof rows)[number]) => ({
    id: row.id,
    body: row.body,
    author: personaOf(row.userId, row.username),
    since: formatAgo(row.createdAt, now),
  });

  const replies = rows.filter((row) => row.parentId !== null);

  return rows
    .filter((row) => row.parentId === null)
    .map((row) => ({
      ...said(row),
      votes: row.votes,
      voted: mine.has(row.id),
      replies: replies.filter((reply) => reply.parentId === row.id).map(said),
    }))
    .sort((first, second) => second.votes - first.votes);
};

export const createFeature = async (userId: string, title: string, description: string) => {
  const [created] = await getDb()
    .insert(featureRequests)
    .values({ userId, title, description })
    .$returningId();

  return created.id;
};

export const findComment = async (id: string) => {
  const [row] = await getDb()
    .select({
      id: featureComments.id,
      featureId: featureComments.featureId,
      parentId: featureComments.parentId,
    })
    .from(featureComments)
    .where(eq(featureComments.id, id))
    .limit(1);

  return row ?? null;
};

export const createComment = (
  featureId: string,
  userId: string,
  body: string,
  parentId: string | null,
) => getDb().insert(featureComments).values({ featureId, userId, body, parentId });

export const toggleVote = async (subject: VoteSubject, subjectId: string, userId: string) => {
  const theirs = and(
    eq(featureVotes.subject, subject),
    eq(featureVotes.subjectId, subjectId),
    eq(featureVotes.userId, userId),
  );

  const [existing] = await getDb()
    .select({ id: featureVotes.id })
    .from(featureVotes)
    .where(theirs)
    .limit(1);

  if (existing) {
    await getDb().delete(featureVotes).where(theirs);

    return;
  }

  // Two clicks in flight both read no vote here, and the second must not throw.
  await getDb()
    .insert(featureVotes)
    .values({ subject, subjectId, userId })
    .onDuplicateKeyUpdate({ set: { userId } });
};
