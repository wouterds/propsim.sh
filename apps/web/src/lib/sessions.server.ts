import { getDb, type Session, sessions } from "@propsim/database";
import { and, desc, eq, isNull, ne } from "drizzle-orm";
import { readDevice } from "./device";
import { readOrigin } from "./origin.server";
import { hashToken, newToken } from "./token.server";

export type RevokeReason = NonNullable<Session["revokedReason"]>;

// A session dies of old age even if it is used daily, so a token that leaked
// cannot be kept alive forever by using it. NIST puts the ceiling for a
// password-only account at 30 days.
const LIFETIME_DAYS = 30;

// And it dies of neglect, which is what closes the laptop somebody sold.
const IDLE_DAYS = 14;

// `last_seen_at` drives a line of text. Writing it on every navigation costs a
// row update per request and buys nothing.
const TOUCH_AFTER_MINUTES = 5;

const days = (count: number) => count * 24 * 60 * 60 * 1000;
const minutes = (count: number) => count * 60 * 1000;

export const isLive = (session: Session, now = new Date()) => {
  if (session.revokedAt) {
    return false;
  }

  const idleFor = now.getTime() - session.lastSeenAt.getTime();

  return session.expiresAt.getTime() > now.getTime() && idleFor < days(IDLE_DAYS);
};

const describe = (request: Request) => {
  const origin = readOrigin(request);
  const device = readDevice(origin.userAgent);

  return { ...origin, browser: device.browser, os: device.os, kind: device.kind };
};

/** Returns the token for the cookie. Only its hash is stored. */
export const openSession = async (request: Request, userId: string) => {
  const token = newToken();
  const now = new Date();

  await getDb()
    .insert(sessions)
    .values({
      userId,
      hash: hashToken(token),
      lastSeenAt: now,
      expiresAt: new Date(now.getTime() + days(LIFETIME_DAYS)),
      ...describe(request),
    });

  return token;
};

export const findSession = async (token: string) => {
  const [session] = await getDb()
    .select()
    .from(sessions)
    .where(eq(sessions.hash, hashToken(token)))
    .limit(1);

  if (!session || !isLive(session)) {
    return null;
  }

  return session;
};

/**
 * Keeps one row describing the same browser rather than leaving stale text. A
 * browser update rewrites the user agent, and which session this is comes from
 * the cookie, so there is nothing here that should make a second row.
 */
export const touchSession = async (session: Session, request: Request) => {
  const now = new Date();

  if (now.getTime() - session.lastSeenAt.getTime() < minutes(TOUCH_AFTER_MINUTES)) {
    return;
  }

  await getDb()
    .update(sessions)
    .set({ lastSeenAt: now, ...describe(request) })
    .where(eq(sessions.id, session.id));
};

export const listSessions = (userId: string) =>
  getDb()
    .select()
    .from(sessions)
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)))
    .orderBy(desc(sessions.lastSeenAt));

const close = { revokedAt: new Date() };

/** Scoped to the owner, so an id read off someone else's page closes nothing. */
export const revokeSession = (userId: string, id: string, revokedReason: RevokeReason) =>
  getDb()
    .update(sessions)
    .set({ ...close, revokedReason })
    .where(and(eq(sessions.id, id), eq(sessions.userId, userId), isNull(sessions.revokedAt)));

/** Everything but the session asking, which keeps the current tab signed in. */
export const revokeOtherSessions = (userId: string, keep: string, revokedReason: RevokeReason) =>
  getDb()
    .update(sessions)
    .set({ ...close, revokedReason })
    .where(and(eq(sessions.userId, userId), ne(sessions.id, keep), isNull(sessions.revokedAt)));

export const revokeAllSessions = (userId: string, revokedReason: RevokeReason) =>
  getDb()
    .update(sessions)
    .set({ ...close, revokedReason })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
