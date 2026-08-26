import { accounts, getDb } from "@propsim/database";
import {
  balanceOf,
  carriedInOf,
  equityOf,
  failedDuringOf,
  failedOf,
  ledgerOf,
  peakOf,
  positionsOf,
  targetOf,
  tradeDateOf,
  trailingFloorOf,
} from "@propsim/engine";
import { and, eq, isNull, sql } from "drizzle-orm";
import { findAccount, rulesOf } from "./accounts";
import { touchTradingDay } from "./days";
import { listFills } from "./fills";
import { flatten } from "./marking";
import { notifyBreach, notifyNews } from "./notify";

/** Only ever rises, so a fold that proposes less than the stored mark loses. */
export const raisePeak = (id: string, peakEquityCents: number) =>
  getDb()
    .update(accounts)
    .set({ peakEquityCents: sql`GREATEST(${accounts.peakEquityCents}, ${peakEquityCents})` })
    .where(eq(accounts.id, id));

/** The daily floor is absent on purpose: it shuts the session, never the account. */
type EndedReason = "trailing_drawdown" | "news" | "target_met";

/**
 * Ends the account and says whether this call was the one that did it. The
 * `ended_at IS NULL` is what makes that answer worth trusting: a second call
 * changes no row, so a notice fires once without a column to remember it by.
 *
 * Stamped at the instant the floor was met, not at the sweep that noticed.
 */
const endAccount = async (id: string, endedReason: EndedReason, at: Date) => {
  const [result] = await getDb()
    .update(accounts)
    .set({ endedAt: at, endedReason })
    .where(and(eq(accounts.id, id), isNull(accounts.endedAt)));

  return result.affectedRows > 0;
};

/**
 * Marks the account, ratchets both water marks and judges the floors. Reads the
 * stream back after the write, so all three are decided on what was stored
 * rather than on what the caller expected to store.
 */
export const settle = async (accountId: string, at: Date) => {
  const row = await findAccount(accountId);

  if (!row) {
    return;
  }

  const ledger = ledgerOf(await listFills(accountId), row.startingBalanceCents);
  const equityCents = equityOf(ledger);
  const tradeDate = tradeDateOf(at);

  await touchTradingDay(accountId, tradeDate, at, {
    openEquityCents: carriedInOf(ledger, tradeDate),
    lowEquityCents: equityCents,
  });

  const peakEquityCents = Math.max(row.peakEquityCents, peakOf(ledger));

  await raisePeak(accountId, peakEquityCents);

  const rules = rulesOf(row);

  // Now against now, and the fill history against the floor as it stood at each
  // print. Never the session's stored low against the floor as it stands today:
  // that low belongs to a moment when the peak, and so the floor, was lower, and
  // reading the two together ends an account on a trade that made money.
  //
  // Nothing re-reads the stored low for this. The sweep judged it against the
  // peak of its own moment and ended the account there if it had to.
  //
  // The daily floor is judged nowhere here: it shuts the session rather than the
  // account, and `lockedFor` reads that straight off the day's own low.
  const failed =
    failedOf(rules, { lowEquityCents: equityCents, peakEquityCents }) ||
    failedDuringOf(rules, ledger.path, row.startingBalanceCents);

  if (failed) {
    if (await endAccount(accountId, "trailing_drawdown", at)) {
      await notifyBreach(accountId, equityCents, trailingFloorOf(rules, peakEquityCents));
    }

    return;
  }

  // Banked, never floating. A target met on an open position is money the
  // account has not made, and the screen has always counted it this way.
  if (balanceOf(ledger) >= targetOf(rules)) {
    if (await endAccount(accountId, "target_met", at)) {
      // A passed account is done trading, so nothing is left marking against a
      // tape it can no longer act on. Closed where each contract last printed.
      await flatten(accountId, positionsOf(ledger), ledger.marks, at);
    }
  }
};

/**
 * Ends an account that was not flat through a red folder release. Nothing is
 * flattened: the position is the breach, and closing it now would rewrite what
 * the account was holding when the release printed.
 */
export const failForNews = async (accountId: string, release: string, at: number) => {
  if (await endAccount(accountId, "news", new Date(at))) {
    await notifyNews(accountId, release, at);
  }
};
