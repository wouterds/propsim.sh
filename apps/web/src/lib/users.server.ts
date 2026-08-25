import { getDb, users } from "@propsim/database";
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

export const createUser = async (email: string, password: string | null) => {
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
 * Takes the person out of the row rather than dropping it. The address is what
 * ties the account to somebody, so anonymising it and stamping the date is what
 * makes the rest untraceable, and the id stays unique either way.
 */
export const deleteUser = (id: string) =>
  getDb()
    .update(users)
    // .invalid is reserved and resolves nowhere, so nothing can be sent to it.
    .set({ email: `deleted-${id}@deleted.invalid`, deletedAt: new Date() })
    .where(eq(users.id, id));
