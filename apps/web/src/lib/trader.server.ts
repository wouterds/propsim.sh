import { accounts as accountsTable, getDb, users } from "@propsim/database";
import { balanceOf, ledgerOf, statsOf, toDollars } from "@propsim/engine";
import { listFillsFor } from "@propsim/orders";
import { findPlan } from "@propsim/plans";
import { desc, eq, sql } from "drizzle-orm";

type TraderAccount = {
  id: string;
  name: string;
  plan: string;
  size: number;
  state: "live" | "passed" | "breached";
  pnl: number;
  openedOn: string;
};

/**
 * A trader as anybody may see them. Never their address, and never an account
 * they have not asked to show.
 *
 * A deleted trader keeps their record and loses their name, so the standings
 * they earned still add up and nothing on the page points at a person.
 */
export const loadTrader = async (id: string) => {
  // The id comes off the address, and the column refuses anything that is not
  // one. Asking with a word rather than an id is a page that is not there.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return null;
  }

  const [user] = await getDb().select().from(users).where(eq(users.id, id)).limit(1);

  if (!user) {
    return null;
  }

  const gone = user.deletedAt !== null;
  const rows = await getDb()
    .select()
    .from(accountsTable)
    .where(eq(accountsTable.userId, id))
    // Live first, then whatever was touched most recently, same as the sidebar.
    .orderBy(
      sql`${accountsTable.endedAt} is not null`,
      desc(accountsTable.updatedAt),
      desc(accountsTable.createdAt),
    );

  const fills = await listFillsFor(rows.map((row) => row.id));
  const ledgers = rows.map((row) => ledgerOf(fills.get(row.id) ?? [], row.startingBalanceCents));

  const accounts: TraderAccount[] = rows.map((row, index) => ({
    id: row.id,
    name: row.name,
    plan: findPlan(row.planId)?.label ?? row.planId,
    size: toDollars(row.startingBalanceCents),
    state: row.endedReason === "target_met" ? "passed" : row.endedAt !== null ? "breached" : "live",
    pnl: toDollars(balanceOf(ledgers[index]) - row.startingBalanceCents),
    openedOn: row.openedOn,
  }));

  const target = rows.reduce((total, row) => total + row.profitTargetCents, 0);
  const stats = statsOf(ledgers.flatMap((ledger) => ledger.trips));

  return {
    id: user.id,
    username: gone ? null : user.username,
    gone,
    joinedOn: user.createdAt.toISOString(),
    links: gone
      ? { twitter: null, youtube: null, twitch: null }
      : { twitter: user.twitter, youtube: user.youtube, twitch: user.twitch },
    // The preference is theirs, but a profile nobody owns any more shows nothing.
    showsAccounts: user.showsAccounts && !gone,
    accounts,
    counts: {
      total: accounts.length,
      live: accounts.filter((one) => one.state === "live").length,
      passed: accounts.filter((one) => one.state === "passed").length,
      breached: accounts.filter((one) => one.state === "breached").length,
    },
    stats,
    // The starting balance is not their money and was never at risk, so the
    // only percentage worth printing is how far along the target they are.
    targetWas: toDollars(target),
    targetShare: target === 0 ? null : stats.pnlCents / target,
  };
};
