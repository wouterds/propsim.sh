import { getDb, type Session, sessions } from "@propsim/database";
import { and, desc, eq, isNull, ne } from "drizzle-orm";
import { readDevice } from "./device";
import { readOrigin } from "./origin.server";
import { hashToken, newToken } from "./token.server";

export type RevokeReason = NonNullable<Session["revokedReason"]>;

// A leaked token cannot be kept alive by being used.
const LIFETIME_DAYS = 30;

const IDLE_DAYS = 14;

// It drives a line of text, so it is not worth a row update per request.
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

/** A browser update rewrites the row rather than adding one. */
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

export type Recognition = "first" | "known" | "new";

type Marks = { browser: string | null; os: string | null; country: string | null };

/**
 * Matched on the family names and the country, never on the version. A browser
 * updating itself is not a new device, and a sign in from another country is.
 */
export const isKnown = (seen: Marks[], device: Marks) =>
  seen.some(
    (mark) =>
      mark.browser === device.browser && mark.os === device.os && mark.country === device.country,
  );

/** Call before the session is opened, or it recognises the row it just wrote. */
export const recognise = async (userId: string, request: Request): Promise<Recognition> => {
  const device = describe(request);
  const seen = await getDb()
    .select({ browser: sessions.browser, os: sessions.os, country: sessions.country })
    .from(sessions)
    .where(eq(sessions.userId, userId));

  if (seen.length === 0) {
    return "first";
  }

  return isKnown(seen, device) ? "known" : "new";
};

export const listSessions = (userId: string) =>
  getDb()
    .select()
    .from(sessions)
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)))
    .orderBy(desc(sessions.lastSeenAt));

const close = { revokedAt: new Date() };

/** Scoped to the owner, so a guessed id closes nothing. */
export const revokeSession = (userId: string, id: string, revokedReason: RevokeReason) =>
  getDb()
    .update(sessions)
    .set({ ...close, revokedReason })
    .where(and(eq(sessions.id, id), eq(sessions.userId, userId), isNull(sessions.revokedAt)));

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
