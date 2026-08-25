import {
  type Account as AccountRow,
  accounts as accountsTable,
  fills as fillsTable,
  getDb,
  type TradingDay,
  tradingDays,
} from "@propsim/database";
import {
  type AccountRules,
  type Breach,
  balanceOf,
  cents,
  type DayAnchor,
  equityOf,
  type Ledger,
  ledgerOf,
  peakOf,
  summariseDays,
  toDollars,
  toPrice,
  tradeDateOf,
} from "@propsim/engine";
import type { Plan } from "@propsim/plans";
import { findPlan } from "@propsim/plans";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import type { Account, AccountStatus } from "./accounts";
import type { JournalDay } from "./journal";

export type { AccountRow };

const statusOf = (row: AccountRow): AccountStatus => {
  if (!row.endedAt) return "live";

  return row.endedReason === "target_met" ? "passed" : "breached";
};

/** The label is cosmetic, so a plan dropped from the catalog degrades to its id. */
const planFrom = (row: AccountRow): Plan => ({
  id: row.planId,
  label: findPlan(row.planId)?.label ?? row.planId,
  size: toDollars(row.startingBalanceCents),
  profitTarget: toDollars(row.profitTargetCents),
  trailingDrawdown: toDollars(row.trailingDrawdownCents),
  dailyLossLimit: toDollars(row.dailyLossLimitCents),
  maxMinis: row.maxMinis,
  maxMicros: row.maxMicros,
  lockAboveStart: toDollars(row.lockAboveStartCents),
});

export const listFills = (accountId: string) =>
  getDb()
    .select()
    .from(fillsTable)
    .where(eq(fillsTable.accountId, accountId))
    // UUIDv7 breaks the tie, so two fills in the same millisecond keep their order.
    .orderBy(asc(fillsTable.at), asc(fillsTable.id));

export const listTradingDays = (accountId: string) =>
  getDb()
    .select()
    .from(tradingDays)
    .where(eq(tradingDays.accountId, accountId))
    .orderBy(desc(tradingDays.tradeDate));

const listAccountRows = (userId: string) =>
  getDb()
    .select()
    .from(accountsTable)
    .where(eq(accountsTable.userId, userId))
    .orderBy(desc(accountsTable.createdAt));

const findAccountRow = async (userId: string, id: string) => {
  const [row] = await getDb()
    .select()
    .from(accountsTable)
    .where(and(eq(accountsTable.id, id), eq(accountsTable.userId, userId)))
    .limit(1);

  return row ?? null;
};

export const rulesOfRow = (row: AccountRow): AccountRules => ({
  startingBalanceCents: row.startingBalanceCents,
  profitTargetCents: row.profitTargetCents,
  trailingDrawdownCents: row.trailingDrawdownCents,
  dailyLossLimitCents: row.dailyLossLimitCents,
  lockAboveStartCents: row.lockAboveStartCents,
});

export const createAccount = async (userId: string, plan: Plan, openedOn: string) => {
  const startingBalanceCents = cents(plan.size);

  const [created] = await getDb()
    .insert(accountsTable)
    .values({
      userId,
      planId: plan.id,
      name: `${plan.label} Daily`,
      openedOn,
      startingBalanceCents,
      profitTargetCents: cents(plan.profitTarget),
      trailingDrawdownCents: cents(plan.trailingDrawdown),
      dailyLossLimitCents: cents(plan.dailyLossLimit),
      lockAboveStartCents: cents(plan.lockAboveStart),
      maxMinis: plan.maxMinis,
      maxMicros: plan.maxMicros,
      peakEquityCents: startingBalanceCents,
    })
    .$returningId();

  return created.id;
};

/** Only ever rises, so a fold that proposes less than the stored mark loses. */
export const raisePeak = (id: string, peakEquityCents: number) =>
  getDb()
    .update(accountsTable)
    .set({ peakEquityCents: sql`GREATEST(${accountsTable.peakEquityCents}, ${peakEquityCents})` })
    .where(eq(accountsTable.id, id));

export const endAccount = (id: string, endedReason: Breach | "target_met") =>
  getDb()
    .update(accountsTable)
    .set({ endedAt: new Date(), endedReason })
    .where(and(eq(accountsTable.id, id), isNull(accountsTable.endedAt)));

const anchorsOf = (days: TradingDay[]): DayAnchor[] =>
  days.map((day) => ({
    tradeDate: day.tradeDate,
    openEquityCents: day.openEquityCents,
    lowEquityCents: day.lowEquityCents,
  }));

const toJournalDay = (day: ReturnType<typeof summariseDays>[number]): JournalDay => ({
  date: day.date,
  trades: day.trades,
  wins: day.wins,
  worstDrawdown: toDollars(day.worstDrawdownCents),
  pnl: toDollars(day.pnlCents),
  verdict: day.verdict,
});

export type LoadedAccount = {
  row: AccountRow;
  ledger: Ledger;
  anchors: DayAnchor[];
  account: Account;
};

/** Where the last session left the equity, which is what the new one opens on. */
const carriedInCents = (ledger: Ledger, tradeDate: string) => {
  const earlier = ledger.path.filter((point) => point.tradeDate < tradeDate);

  return earlier.at(-1)?.equityCents ?? ledger.startingCents;
};

/**
 * Marked to the last price each contract printed for this account. The terminal
 * re-marks to the delayed tape it is already holding.
 */
const viewOf = (row: AccountRow, ledger: Ledger, anchors: DayAnchor[], now: Date) => {
  const peakEquityCents = Math.max(row.peakEquityCents, peakOf(ledger));
  const tradeDate = tradeDateOf(now);
  const today = anchors.find((anchor) => anchor.tradeDate === tradeDate);
  const equityCents = equityOf(ledger);
  // Where the account stands now, so a session that carried a position in and
  // has not traded it yet still reads as the open loss it is holding.
  const mark = { at: now, tradeDate, equityCents };

  const account: Account = {
    id: row.id,
    name: row.name,
    openedOn: row.openedOn,
    status: statusOf(row),
    plan: planFrom(row),
    balance: toDollars(balanceOf(ledger)),
    equity: toDollars(equityCents),
    peakEquity: toDollars(peakEquityCents),
    // No session row yet. The anchor is where the previous session left the
    // equity, not where it stands now, or a position carried in moves the floor.
    sessionOpenEquity: toDollars(today?.openEquityCents ?? carriedInCents(ledger, tradeDate)),
    journal: summariseDays(ledger, anchors, row.dailyLossLimitCents, mark).map(toJournalDay),
  };

  return account;
};

export const loadAccount = async (
  userId: string,
  id: string,
  now = new Date(),
): Promise<LoadedAccount | null> => {
  const row = await findAccountRow(userId, id);

  if (!row) {
    return null;
  }

  const [fills, days] = await Promise.all([listFills(row.id), listTradingDays(row.id)]);
  const ledger = ledgerOf(fills, row.startingBalanceCents);
  const anchors = anchorsOf(days);

  return { row, ledger, anchors, account: viewOf(row, ledger, anchors, now) };
};

export const loadAccounts = async (userId: string, now = new Date()): Promise<Account[]> => {
  const rows = await listAccountRows(userId);

  return Promise.all(
    rows.map(async (row) => {
      const [fills, days] = await Promise.all([listFills(row.id), listTradingDays(row.id)]);
      const anchors = anchorsOf(days);

      return viewOf(row, ledgerOf(fills, row.startingBalanceCents), anchors, now);
    }),
  );
};

export const loadAccountDay = async (
  userId: string,
  id: string,
  tradeDate: string,
  now = new Date(),
) => {
  const loaded = await loadAccount(userId, id, now);
  const day = loaded?.account.journal.find((entry) => entry.date === tradeDate);

  if (!loaded || !day) {
    return null;
  }

  const trades = loaded.ledger.trips
    .filter((trip) => trip.tradeDate === tradeDate)
    .map((trip, index) => ({
      id: `${trip.instrument}-${index}`,
      at: trip.closedAt.getTime(),
      side: trip.side,
      quantity: trip.quantity,
      entry: toPrice(trip.entry),
      exit: toPrice(trip.exit),
      pnl: toDollars(trip.pnlCents),
      seconds: Math.round((trip.closedAt.getTime() - trip.openedAt.getTime()) / 1000),
    }));

  return { account: loaded.account, day, trades };
};
