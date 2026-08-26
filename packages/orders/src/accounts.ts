import { type Account, accounts, getDb, users } from "@propsim/database";
import { type AccountRules, lockedOutOf, tradeDateOf } from "@propsim/engine";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { findTradingDay } from "./days";

/** The terms the account opened under, which is what every floor is measured from. */
export const rulesOf = (row: Account): AccountRules => ({
  startingBalanceCents: row.startingBalanceCents,
  profitTargetCents: row.profitTargetCents,
  trailingDrawdownCents: row.trailingDrawdownCents,
  dailyLossLimitCents: row.dailyLossLimitCents,
  lockAboveStartCents: row.lockAboveStartCents,
});

export const findAccount = async (id: string) => {
  const [row] = await getDb().select().from(accounts).where(eq(accounts.id, id)).limit(1);

  return row ?? null;
};

/**
 * Whether the session is shut. Derived from the day's own low water mark rather
 * than stored, so it cannot disagree with the floor it is measured against, and
 * it lifts on its own when the next session opens its own row.
 *
 * The mark only falls, so a session that went through the floor and recovered
 * stays shut for the rest of the day.
 */
export const lockedFor = async (row: Account, at: Date) => {
  const day = await findTradingDay(row.id, tradeDateOf(at));

  return day !== null && lockedOutOf(rulesOf(row), day);
};

/**
 * Every address that could still be breached by a release: an account that has
 * not ended, an owner who is still here, and an address they have confirmed.
 */
export const listAtRisk = async () => {
  const rows = await getDb()
    .selectDistinct({ email: users.email })
    .from(accounts)
    .innerJoin(users, eq(users.id, accounts.userId))
    .where(
      and(isNull(accounts.endedAt), isNull(users.deletedAt), isNotNull(users.verifiedEmailAt)),
    );

  return rows.map((row) => row.email);
};
