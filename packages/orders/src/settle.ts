import { type Account, accounts, getDb } from "@propsim/database";
import {
  type AccountRules,
  type Breach,
  breachOf,
  equityOf,
  ledgerOf,
  peakOf,
  targetOf,
  tradeDateOf,
} from "@propsim/engine";
import { and, eq, isNull, sql } from "drizzle-orm";
import { findTradingDay, touchTradingDay } from "./days";
import { listFills } from "./fills";

const rulesOf = (row: Account): AccountRules => ({
  startingBalanceCents: row.startingBalanceCents,
  profitTargetCents: row.profitTargetCents,
  trailingDrawdownCents: row.trailingDrawdownCents,
  dailyLossLimitCents: row.dailyLossLimitCents,
  lockAboveStartCents: row.lockAboveStartCents,
});

/** Only ever rises, so a fold that proposes less than the stored mark loses. */
const raisePeak = (id: string, peakEquityCents: number) =>
  getDb()
    .update(accounts)
    .set({ peakEquityCents: sql`GREATEST(${accounts.peakEquityCents}, ${peakEquityCents})` })
    .where(eq(accounts.id, id));

const endAccount = (id: string, endedReason: Breach | "target_met") =>
  getDb()
    .update(accounts)
    .set({ endedAt: new Date(), endedReason })
    .where(and(eq(accounts.id, id), isNull(accounts.endedAt)));

const findAccount = async (id: string) => {
  const [row] = await getDb().select().from(accounts).where(eq(accounts.id, id)).limit(1);

  return row ?? null;
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

  await touchTradingDay(accountId, tradeDate, at, equityCents);

  const peakEquityCents = Math.max(row.peakEquityCents, peakOf(ledger));
  const day = await findTradingDay(accountId, tradeDate);

  await raisePeak(accountId, peakEquityCents);

  const rules = rulesOf(row);
  const breach = breachOf(rules, {
    lowEquityCents: Math.min(day?.lowEquityCents ?? equityCents, equityCents),
    peakEquityCents,
    sessionOpenCents: day?.openEquityCents ?? equityCents,
  });

  if (breach) {
    await endAccount(accountId, breach);

    return;
  }

  if (equityCents >= targetOf(rules)) {
    await endAccount(accountId, "target_met");
  }
};
