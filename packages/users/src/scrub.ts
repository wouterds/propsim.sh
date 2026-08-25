import { getDb, users } from "@propsim/database";
import { scrubEmailLogs } from "@propsim/mail/log";
import { and, eq, isNull } from "drizzle-orm";

/** The address that replaces theirs. `.invalid` is reserved and resolves nowhere. */
export const anonymousAddress = (id: string) => `deleted-${id}@deleted.invalid`;

/**
 * Takes the person out of the row rather than dropping it. The address is what
 * ties the account to somebody, so anonymising it is what makes the rest
 * untraceable, and the id stays unique either way.
 *
 * Returns false when there was nothing live to empty.
 */
export const scrubUser = async (id: string) => {
  const [user] = await getDb()
    .select()
    .from(users)
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .limit(1);

  if (!user) {
    return false;
  }

  const anonymised = anonymousAddress(id);

  // Before the row is rewritten, while the old address is still readable.
  await scrubEmailLogs(user.email, anonymised);

  await getDb()
    .update(users)
    // The username goes too, or a deleted account holds a name nobody can take.
    .set({ email: anonymised, username: null, deletedAt: new Date(), inactivityNotice: null })
    .where(eq(users.id, id));

  return true;
};
