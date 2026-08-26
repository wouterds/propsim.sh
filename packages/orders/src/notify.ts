import { accounts, getDb, users } from "@propsim/database";
import { toDollars } from "@propsim/engine";
import { sendAccountBreached, sendAccountNews } from "@propsim/mail";
import { eq } from "drizzle-orm";

const MONEY = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const money = (cents: number) => MONEY.format(toDollars(cents));

const CHICAGO = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  dateStyle: "medium",
  timeStyle: "short",
  timeZoneName: "short",
});

const owner = async (accountId: string) => {
  const [row] = await getDb()
    .select({ email: users.email, name: accounts.name, deletedAt: users.deletedAt })
    .from(accounts)
    .innerJoin(users, eq(users.id, accounts.userId))
    .where(eq(accounts.id, accountId))
    .limit(1);

  // An emptied user has no address left to send to.
  return !row || row.deletedAt ? null : row;
};

/** The account is already closed. A notice that will not go out must not take that write down with it. */
const quietly = async (accountId: string, send: () => Promise<void>) => {
  try {
    await send();
  } catch (error) {
    console.error(`breach notice failed for ${accountId}`, error);
  }
};

/** Tells the owner the trailing floor took the account, and where. */
export const notifyBreach = async (accountId: string, equityCents: number, floorCents: number) => {
  const row = await owner(accountId);

  if (!row) {
    return;
  }

  await quietly(accountId, () =>
    sendAccountBreached({
      to: row.email,
      account: row.name,
      equity: money(equityCents),
      floor: money(floorCents),
    }),
  );
};

/** Tells the owner they were not flat for a red folder release. */
export const notifyNews = async (accountId: string, release: string, at: number) => {
  const row = await owner(accountId);

  if (!row) {
    return;
  }

  await quietly(accountId, () =>
    sendAccountNews({
      to: row.email,
      account: row.name,
      release,
      at: CHICAGO.format(new Date(at)),
    }),
  );
};
