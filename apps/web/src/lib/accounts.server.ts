import {
  type Account as AccountRow,
  accounts as accountsTable,
  getDb,
  type TradingDay,
  tradingDays,
} from "@propsim/database";
import {
  balanceOf,
  cents,
  type DayAnchor,
  dailyFloorOf,
  equityOf,
  type Ledger,
  ledgerOf,
  lockedOutOf,
  statusOf as orderStatusOf,
  peakOf,
  summariseDays,
  toDollars,
  toPrice,
  tradeDateOf,
  trailingFloorOf,
} from "@propsim/engine";
import { listFills, listFillsFor, rulesOf } from "@propsim/orders";
import type { Plan } from "@propsim/plans";
import { findPlan } from "@propsim/plans";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { Account, AccountStatus } from "./accounts";
import type { JournalDay } from "./journal";
import { listOrders } from "./orders.server";

export type { AccountRow };

/**
 * A session shut by the daily floor reads as locked, not as breached. The live
 * equity is folded into the day's stored low, so the lock shows the moment the
 * floor is crossed rather than at the next write.
 */
const statusOf = (
  row: AccountRow,
  today: DayAnchor | undefined,
  equityCents: number,
): AccountStatus => {
  if (row.endedAt) {
    return row.endedReason === "target_met" ? "passed" : "breached";
  }

  if (!today) {
    return "live";
  }

  const day = {
    openEquityCents: today.openEquityCents,
    lowEquityCents: Math.min(today.lowEquityCents, equityCents),
  };

  return lockedOutOf(rulesOf(row), day) ? "locked" : "live";
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

const listTradingDays = (accountId: string) =>
  getDb()
    .select()
    .from(tradingDays)
    .where(eq(tradingDays.accountId, accountId))
    .orderBy(desc(tradingDays.tradeDate));

/** Every account's sessions in one query, for the shell that reads them all. */
const listTradingDaysFor = async (accountIds: string[]) => {
  const grouped = new Map<string, TradingDay[]>();

  for (const id of accountIds) {
    grouped.set(id, []);
  }

  if (accountIds.length === 0) {
    return grouped;
  }

  const rows = await getDb()
    .select()
    .from(tradingDays)
    .where(inArray(tradingDays.accountId, accountIds))
    .orderBy(desc(tradingDays.tradeDate));

  for (const row of rows) {
    grouped.get(row.accountId)?.push(row);
  }

  return grouped;
};

/**
 * Live first, then whatever was touched most recently. An account that ended
 * weeks ago is history, and it should not sit above the one being traded.
 */
const listAccountRows = (userId: string) =>
  getDb()
    .select()
    .from(accountsTable)
    .where(eq(accountsTable.userId, userId))
    .orderBy(
      sql`${accountsTable.endedAt} is not null`,
      desc(accountsTable.updatedAt),
      desc(accountsTable.createdAt),
    );

const findAccountRow = async (userId: string, id: string) => {
  const [row] = await getDb()
    .select()
    .from(accountsTable)
    .where(and(eq(accountsTable.id, id), eq(accountsTable.userId, userId)))
    .limit(1);

  return row ?? null;
};

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
  /** The prints themselves, which the fold turns into trips and loses. */
  fills: Awaited<ReturnType<typeof listFills>>;
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
    status: statusOf(row, today, equityCents),
    plan: planFrom(row),
    balance: toDollars(balanceOf(ledger)),
    equity: toDollars(equityCents),
    peakEquity: toDollars(peakEquityCents),
    feesPaid: toDollars(ledger.feesCents),
    endedAt: row.endedAt ? row.endedAt.toISOString() : null,
    endedReason: row.endedReason,
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

  return { row, ledger, anchors, fills, account: viewOf(row, ledger, anchors, now) };
};

/**
 * Every account a trader has. Two queries whatever the count, because the shell
 * around every signed in page reads this and a query for each account turns one
 * page into a round trip per account they ever opened.
 */
export const loadAccounts = async (userId: string, now = new Date()): Promise<Account[]> => {
  const rows = await listAccountRows(userId);
  const ids = rows.map((row) => row.id);
  const [fills, days] = await Promise.all([listFillsFor(ids), listTradingDaysFor(ids)]);

  return rows.map((row) => {
    const anchors = anchorsOf(days.get(row.id) ?? []);
    const ledger = ledgerOf(fills.get(row.id) ?? [], row.startingBalanceCents);

    return viewOf(row, ledger, anchors, now);
  });
};

/** What the trader did, rather than what the row calls it. */
const kindOf = (type: string, intent: string) => {
  if (intent === "stop_loss") return "Stop loss";
  if (intent === "take_profit") return "Target";

  return type === "market" ? "Market" : type === "limit" ? "Limit" : "Stop";
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
      instrument: trip.instrument,
      side: trip.side,
      quantity: trip.quantity,
      entry: toPrice(trip.entry),
      exit: toPrice(trip.exit),
      // Net, because it is what the trade was worth to the account. The session
      // total is folded off the equity path, which is net of commission too.
      pnl: toDollars(trip.pnlCents - trip.feeCents),
      fees: toDollars(trip.feeCents),
      seconds: Math.round((trip.closedAt.getTime() - trip.openedAt.getTime()) / 1000),
    }));

  const orderRows = await listOrders(loaded.row.id);
  const orders = new Map(orderRows.map((order) => [order.id, order] as const));

  const placed = orderRows
    .filter((order) => order.tradeDate === tradeDate)
    .map((order) => {
      const taken = loaded.fills.filter((fill) => fill.orderId === order.id);
      const filled = taken.reduce((total, fill) => total + fill.quantity, 0);

      return {
        id: order.id,
        at: order.placedAt.getTime(),
        instrument: order.instrument,
        side: order.side,
        quantity: order.quantity,
        filled,
        // A market order has no price of its own until a fill gives it one.
        price: order.price === null ? null : toPrice(order.price),
        kind: kindOf(order.type, order.intent),
        status: orderStatusOf(order, filled),
      };
    });

  const fills = loaded.fills
    .filter((fill) => fill.tradeDate === tradeDate)
    .map((fill) => {
      const order = orders.get(fill.orderId);

      return {
        id: fill.id,
        at: fill.at.getTime(),
        instrument: fill.instrument,
        side: fill.side,
        quantity: fill.quantity,
        price: toPrice(fill.price),
        fee: toDollars(fill.feeCents),
        kind: order ? kindOf(order.type, order.intent) : "Market",
      };
    });

  const rules = rulesOf(loaded.row);
  const anchor = loaded.anchors.find((one) => one.tradeDate === tradeDate);
  const openEquityCents = anchor?.openEquityCents ?? carriedInCents(loaded.ledger, tradeDate);
  const lowEquityCents = anchor?.lowEquityCents ?? openEquityCents;

  const session = {
    openEquity: toDollars(openEquityCents),
    lowEquity: toDollars(lowEquityCents),
    dailyFloor: toDollars(dailyFloorOf(rules, openEquityCents)),
    trailingFloor: toDollars(trailingFloorOf(rules, cents(loaded.account.peakEquity))),
    lockedOut: lockedOutOf(rules, { openEquityCents, lowEquityCents }),
    fees: fills.reduce((total, fill) => total + fill.fee, 0),
  };

  // Only when this is the session it happened in. An account ended on Tuesday
  // says nothing about the Monday being read.
  const ended =
    loaded.row.endedAt && tradeDateOf(loaded.row.endedAt) === tradeDate
      ? { reason: loaded.row.endedReason, at: loaded.row.endedAt.getTime() }
      : null;

  // Newest first. A session is read back from what just happened, not forward
  // from where it started.
  const newestFirst = <T>(rows: T[], at: (row: T) => number) =>
    [...rows].sort((one, two) => at(two) - at(one));

  return {
    account: loaded.account,
    day,
    trades: newestFirst(trades, (trade) => trade.at),
    fills: newestFirst(fills, (fill) => fill.at),
    placed: newestFirst(placed, (order) => order.at),
    session,
    ended,
  };
};
