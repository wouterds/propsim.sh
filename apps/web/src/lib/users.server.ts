import {
  emailChanges,
  emailVerifications,
  getDb,
  passwordResets,
  sessions,
  users,
} from "@propsim/database";
import { and, eq, isNull } from "drizzle-orm";

// A deleted account is a row with nobody in it. It must not answer to a login,
// to a reset, or to the address it used to hold.
const live = isNull(users.deletedAt);

export const findUserByEmail = async (email: string) => {
  const [user] = await getDb()
    .select()
    .from(users)
    .where(and(eq(users.email, email), live))
    .limit(1);

  return user ?? null;
};

export const findUserById = async (id: string) => {
  const [user] = await getDb()
    .select()
    .from(users)
    .where(and(eq(users.id, id), live))
    .limit(1);

  return user ?? null;
};

export const createUser = async (email: string, password: string) => {
  const [created] = await getDb().insert(users).values({ email, password }).$returningId();

  return created.id;
};

export const markEmailVerified = (id: string) =>
  getDb().update(users).set({ verifiedEmailAt: new Date() }).where(eq(users.id, id));

export const updatePassword = (id: string, password: string) =>
  getDb().update(users).set({ password }).where(eq(users.id, id));

export const updateEmail = (id: string, email: string) =>
  getDb().update(users).set({ email, verifiedEmailAt: new Date() }).where(eq(users.id, id));

/**
 * Empties the account rather than dropping the row, so the id stays unique and
 * nothing that once pointed at it points at somebody else. The address is freed
 * for a fresh signup, and every device is signed out with it.
 */
export const deleteUser = async (id: string) => {
  const db = getDb();

  await db.delete(sessions).where(eq(sessions.userId, id));
  await db.delete(emailVerifications).where(eq(emailVerifications.userId, id));
  await db.delete(passwordResets).where(eq(passwordResets.userId, id));
  await db.delete(emailChanges).where(eq(emailChanges.userId, id));

  await db
    .update(users)
    .set({
      // .invalid is reserved and resolves nowhere, so nothing can be sent to it.
      email: `deleted-${id}@deleted.invalid`,
      // No hash, so no password verifies against it either.
      password: "",
      verifiedEmailAt: null,
      deletedAt: new Date(),
    })
    .where(eq(users.id, id));
};
