import { accounts, getDb } from "@propsim/database";
import {
  carriedInOf,
  equityOf,
  failedOf,
  ledgerOf,
  peakOf,
  targetOf,
  tradeDateOf,
  trailingFloorOf,
} from "@propsim/engine";
import { and, eq, isNull, sql } from "drizzle-orm";
import { findAccount, rulesOf } from "./accounts";
import { findTradingDay, touchTradingDay } from "./days";
import { listFills } from "./fills";
import { notifyBreach } from "./notify";

/** Only ever rises, so a fold that proposes less than the stored mark loses. */
const raisePeak = (id: string, peakEquityCents: number) =>
  getDb()
    .update(accounts)
    .set({ peakEquityCents: sql`GREATEST(${accounts.peakEquityCents}, ${peakEquityCents})` })
    .where(eq(accounts.id, id));

/** Only the trailing floor ends an account. The daily one ends the session. */
type EndedReason = "trailing_drawdown" | "target_met";

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
  const day = await findTradingDay(accountId, tradeDate);

  await raisePeak(accountId, peakEquityCents);

  const rules = rulesOf(row);
  // The deepest the account went, which is what both floors are read at. A
  // session that went through one and recovered has still been through it.
  const lowEquityCents = Math.min(day?.lowEquityCents ?? equityCents, equityCents);

  // The daily floor is judged nowhere: it shuts the session rather than the
  // account, and `lockedFor` reads that straight off the day's own low.
  if (failedOf(rules, { lowEquityCents, peakEquityCents })) {
    if (await endAccount(accountId, "trailing_drawdown", at)) {
      await notifyBreach(accountId, lowEquityCents, trailingFloorOf(rules, peakEquityCents));
    }

    return;
  }

  if (equityCents >= targetOf(rules)) {
    await endAccount(accountId, "target_met", at);
  }
};
