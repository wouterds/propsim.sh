import { emailChanges, getDb } from "@propsim/database";
import { eq } from "drizzle-orm";
import { EMAIL_CHANGE_TTL_MINUTES } from "./policy";
import { hashToken, newToken } from "./token.server";

const minutes = (count: number) => count * 60 * 1000;

export const issueEmailChange = async (userId: string, email: string) => {
  const token = newToken();
  const row = {
    userId,
    email,
    hash: hashToken(token),
    expiresAt: new Date(Date.now() + minutes(EMAIL_CHANGE_TTL_MINUTES)),
  };

  await getDb()
    .insert(emailChanges)
    .values(row)
    .onDuplicateKeyUpdate({
      set: { email: row.email, hash: row.hash, expiresAt: row.expiresAt, consumedAt: null },
    });

  return token;
};

export const consumeEmailChange = async (token: string) => {
  const [row] = await getDb()
    .select()
    .from(emailChanges)
    .where(eq(emailChanges.hash, hashToken(token)))
    .limit(1);

  if (!row || row.consumedAt || row.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  await getDb()
    .update(emailChanges)
    .set({ consumedAt: new Date() })
    .where(eq(emailChanges.id, row.id));

  return { userId: row.userId, email: row.email };
};
