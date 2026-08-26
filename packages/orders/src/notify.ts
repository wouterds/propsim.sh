import { accounts, getDb, users } from "@propsim/database";
import { toDollars } from "@propsim/engine";
import { sendAccountBreached } from "@propsim/mail";
import { eq } from "drizzle-orm";

const MONEY = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const money = (cents: number) => MONEY.format(toDollars(cents));

/**
 * Tells the owner what ended their account. The address is read here rather
 * than carried in, so an emptied user has nothing left to send to.
 */
export const notifyBreach = async (accountId: string, equityCents: number, floorCents: number) => {
  const [row] = await getDb()
    .select({ email: users.email, name: accounts.name, deletedAt: users.deletedAt })
    .from(accounts)
    .innerJoin(users, eq(users.id, accounts.userId))
    .where(eq(accounts.id, accountId))
    .limit(1);

  if (!row || row.deletedAt) {
    return;
  }

  try {
    await sendAccountBreached({
      to: row.email,
      account: row.name,
      equity: money(equityCents),
      floor: money(floorCents),
    });
  } catch (error) {
    // The account is already closed. A notice that will not go out must not
    // take the write that closed it down with it.
    console.error(`breach notice failed for ${accountId}`, error);
  }
};
