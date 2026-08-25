import { db, emailVerifications } from "@propsim/database";
import { eq } from "drizzle-orm";
import { MAX_ATTEMPTS } from "./verification";
import { codeMatches, expiresAt, generateCode, hashCode } from "./verification.server";

export type CheckResult = "ok" | "wrong" | "expired" | "locked" | "missing";

// One row per user, so a resend replaces the live code rather than adding a
// second one to guess against.
export const issueCode = async (userId: string) => {
  const code = generateCode();
  const row = { userId, hash: hashCode(code), expiresAt: expiresAt(), attempts: 0 };

  await db
    .insert(emailVerifications)
    .values(row)
    .onDuplicateKeyUpdate({ set: { hash: row.hash, expiresAt: row.expiresAt, attempts: 0 } });

  return code;
};

export const checkCode = async (userId: string, code: string): Promise<CheckResult> => {
  const [row] = await db
    .select()
    .from(emailVerifications)
    .where(eq(emailVerifications.userId, userId))
    .limit(1);

  if (!row || row.consumedAt) {
    return "missing";
  }

  if (row.attempts >= MAX_ATTEMPTS) {
    return "locked";
  }

  if (row.expiresAt.getTime() <= Date.now()) {
    return "expired";
  }

  if (!codeMatches(code, row.hash)) {
    // Counted before the answer is returned, or a guess costs nothing.
    await db
      .update(emailVerifications)
      .set({ attempts: row.attempts + 1 })
      .where(eq(emailVerifications.id, row.id));

    return "wrong";
  }

  await db
    .update(emailVerifications)
    .set({ consumedAt: new Date() })
    .where(eq(emailVerifications.id, row.id));

  return "ok";
};
