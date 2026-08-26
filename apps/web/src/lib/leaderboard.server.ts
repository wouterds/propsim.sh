import { accounts, fills, getDb, users } from "@propsim/database";
import { type Fill, ledgerOf, toDollars } from "@propsim/engine";
import { asc, eq, inArray } from "drizzle-orm";
import { personaOf } from "~/components/identity/persona";
import {
  bankedSince,
  cutoffOf,
  medianPnlOf,
  profitableShare,
  type Span,
  type Standing,
  targetShareOf,
} from "./leaderboard";

const BOARD = 10;

type Tally = {
  userId: string;
  username: string | null;
  accounts: number;
  targetCents: number;
  pnlCents: number;
};

const standingOf = (tally: Tally): Standing => {
  const persona = personaOf(tally.userId, tally.username);

  return {
    userId: tally.userId,
    name: persona.name,
    initials: persona.initials,
    hue: persona.hue,
    accounts: tally.accounts,
    targetCents: tally.targetCents,
    pnlCents: tally.pnlCents,
  };
};

export type Row = {
  rank: number;
  /** Their profile, which is the only public page about a trader. */
  id: string;
  name: string;
  initials: string;
  hue: number;
  accounts: number;
  pnl: number;
  /** Share of the profit target reached. Null when there is no target behind it. */
  target: number | null;
};

const toRow = (standing: Standing, index: number): Row => ({
  rank: index + 1,
  id: standing.userId,
  name: standing.name,
  initials: standing.initials,
  hue: standing.hue,
  accounts: standing.accounts,
  pnl: toDollars(standing.pnlCents),
  target: targetShareOf(standing),
});

/**
 * Every account folded from its own fills, then summed per trader. A public
 * page, so nothing on it names an address or an account.
 *
 * A trader who left stays on the board. The sessions happened and the standings
 * behind them would move if they were taken out, so what goes is the name they
 * chose rather than the record: they fall back to the drawn one, which is what
 * everybody who never picked a username is already shown as.
 */
export const loadLeaderboard = async (span: Span, now = new Date()) => {
  const rows = await getDb()
    .select({
      id: accounts.id,
      userId: accounts.userId,
      username: users.username,
      deletedAt: users.deletedAt,
      startingBalanceCents: accounts.startingBalanceCents,
      profitTargetCents: accounts.profitTargetCents,
      endedReason: accounts.endedReason,
    })
    .from(accounts)
    .innerJoin(users, eq(users.id, accounts.userId));

  const empty = {
    standings: [] as Standing[],
    winners: [] as Row[],
    losers: [] as Row[],
    traders: 0,
    accounts: 0,
    passed: 0,
    breached: 0,
    profitable: null as number | null,
    median: null as number | null,
  };

  if (rows.length === 0) {
    return empty;
  }

  const printed = await getDb()
    .select()
    .from(fills)
    .where(
      inArray(
        fills.accountId,
        rows.map((row) => row.id),
      ),
    )
    .orderBy(asc(fills.at), asc(fills.id));

  const byAccount = new Map<string, Fill[]>();

  for (const fill of printed) {
    const held = byAccount.get(fill.accountId) ?? [];

    held.push(fill);
    byAccount.set(fill.accountId, held);
  }

  const cutoff = cutoffOf(span, now);
  const byUser = new Map<string, Tally>();

  for (const row of rows) {
    const ledger = ledgerOf(byAccount.get(row.id) ?? [], row.startingBalanceCents);
    const tally = byUser.get(row.userId) ?? {
      userId: row.userId,
      username: row.deletedAt ? null : row.username,
      accounts: 0,
      targetCents: 0,
      pnlCents: 0,
    };

    tally.accounts += 1;
    tally.targetCents += row.profitTargetCents;
    tally.pnlCents += bankedSince(ledger.trips, cutoff);
    byUser.set(row.userId, tally);
  }

  const standings = [...byUser.values()].map(standingOf).sort((a, b) => b.pnlCents - a.pnlCents);

  // Only the ones who actually moved. A flat trader is neither a winner nor a
  // loser, and padding either board with them would say something untrue.
  const up = standings.filter((standing) => standing.pnlCents > 0);
  const down = standings.filter((standing) => standing.pnlCents < 0);

  return {
    standings,
    winners: up.slice(0, BOARD).map(toRow),
    losers: down
      .slice(-BOARD)
      .reverse()
      .map((standing, index) => toRow(standing, index)),
    traders: standings.length,
    accounts: rows.length,
    passed: rows.filter((row) => row.endedReason === "target_met").length,
    breached: rows.filter(
      (row) => row.endedReason === "daily_loss" || row.endedReason === "trailing_drawdown",
    ).length,
    profitable: profitableShare(standings),
    median: medianPnlOf(standings),
  };
};
