import { getDb, sessions, users } from "@propsim/database";
import { eq, isNull, max, or, sql } from "drizzle-orm";
import { WARN_AFTER_DAYS } from "./inactivity";

export type Dormant = {
  id: string;
  email: string;
  /** The last sign in, or the day the account was opened when there never was one. */
  lastSeenAt: Date;
  notice: "warn" | "final" | null;
};

const DAY = 24 * 60 * 60 * 1000;

/**
 * Live accounts the sweep has something to say about: quiet for long enough to
 * be warned, or carrying a notice that has to be cleared now somebody is back.
 *
 * An account that never opened a session is measured from the day it was made.
 */
export const findDormant = async (now: Date): Promise<Dormant[]> => {
  const quietSince = new Date(now.getTime() - WARN_AFTER_DAYS * DAY);
  const lastSeen = sql<Date>`coalesce(max(${sessions.lastSeenAt}), ${users.createdAt})`;

  const rows = await getDb()
    .select({
      id: users.id,
      email: users.email,
      lastSeenAt: lastSeen,
      notice: users.inactivityNotice,
      createdAt: users.createdAt,
      seen: max(sessions.lastSeenAt),
    })
    .from(users)
    .leftJoin(sessions, eq(sessions.userId, users.id))
    .where(isNull(users.deletedAt))
    .groupBy(users.id)
    .having(or(sql`${lastSeen} <= ${quietSince}`, sql`${users.inactivityNotice} is not null`));

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    lastSeenAt: row.seen ?? row.createdAt,
    notice: row.notice,
  }));
};

export const noteDormancy = (id: string, notice: "warn" | "final") =>
  getDb().update(users).set({ inactivityNotice: notice }).where(eq(users.id, id));

/** They came back, so the next quiet spell starts from nothing. */
export const clearDormancy = (id: string) =>
  getDb().update(users).set({ inactivityNotice: null }).where(eq(users.id, id));
