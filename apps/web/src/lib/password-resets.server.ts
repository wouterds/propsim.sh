import { getDb, passwordResets } from "@propsim/database";
import { eq } from "drizzle-orm";
import { RESET_TTL_MINUTES } from "./policy";
import { hashToken, newToken } from "./token.server";

// Stops the form posting mail to somebody else's inbox.
const RESEND_AFTER_SECONDS = 60;

const minutes = (count: number) => count * 60 * 1000;

/** Null when one went out moments ago, which the caller must not report. */
export const issueReset = async (userId: string) => {
  const [live] = await getDb()
    .select()
    .from(passwordResets)
    .where(eq(passwordResets.userId, userId))
    .limit(1);

  const now = new Date();

  if (live && now.getTime() - live.createdAt.getTime() < RESEND_AFTER_SECONDS * 1000) {
    return null;
  }

  const token = newToken();
  const row = {
    userId,
    hash: hashToken(token),
    expiresAt: new Date(now.getTime() + minutes(RESET_TTL_MINUTES)),
  };

  await getDb()
    .insert(passwordResets)
    .values(row)
    .onDuplicateKeyUpdate({
      set: { hash: row.hash, expiresAt: row.expiresAt, consumedAt: null, createdAt: now },
    });

  return token;
};

/** The token names the user, so the link carries nothing else. */
export const consumeReset = async (token: string) => {
  const [row] = await getDb()
    .select()
    .from(passwordResets)
    .where(eq(passwordResets.hash, hashToken(token)))
    .limit(1);

  if (!row || row.consumedAt || row.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  await getDb()
    .update(passwordResets)
    .set({ consumedAt: new Date() })
    .where(eq(passwordResets.id, row.id));

  return row.userId;
};

export const resetIsLive = async (token: string) => {
  const [row] = await getDb()
    .select()
    .from(passwordResets)
    .where(eq(passwordResets.hash, hashToken(token)))
    .limit(1);

  return Boolean(row && !row.consumedAt && row.expiresAt.getTime() > Date.now());
};
