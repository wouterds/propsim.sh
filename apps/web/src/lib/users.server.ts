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

/** The column collation decides this, so two spellings of one name are one name. */
export const findUserByUsername = async (username: string) => {
  const [user] = await getDb()
    .select()
    .from(users)
    .where(and(eq(users.username, username), live))
    .limit(1);

  return user ?? null;
};

export const updateUsername = (id: string, username: string | null) =>
  getDb().update(users).set({ username }).where(eq(users.id, id));

export type Profile = {
  twitter: string | null;
  youtube: string | null;
  twitch: string | null;
  showsAccounts: boolean;
};

export const updateProfile = (id: string, profile: Profile) =>
  getDb().update(users).set(profile).where(eq(users.id, id));

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
