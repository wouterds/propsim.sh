import { db, users } from "@propsim/database";
import { eq } from "drizzle-orm";

export const findUserByEmail = async (email: string) => {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return user ?? null;
};

export const findUserById = async (id: string) => {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return user ?? null;
};

export const createUser = async (email: string, password: string) => {
  const [created] = await db.insert(users).values({ email, password }).$returningId();

  return created.id;
};

export const markEmailVerified = (id: string) =>
  db.update(users).set({ verifiedEmailAt: new Date() }).where(eq(users.id, id));
