import {
  type AccountRules,
  cents,
  dailyFloorOf as dailyFloorCents,
  targetOf as targetCents,
  toDollars,
  trailingFloorOf as trailingFloorCents,
  type Verdict,
} from "@propsim/engine";
import type { Plan } from "@propsim/plans";
import type { FloorTone } from "./format";
import type { JournalDay } from "./journal";

export type AccountStatus = "live" | "locked" | "passed" | "breached";

/** Locked is still open for business: the position can be closed, and the next session reopens it. */
export const isOpen = (status: AccountStatus) => status === "live" || status === "locked";

/**
 * Read only, and in dollars. Every amount on it was added up in cents first,
 * and the plan is the copy the account carries rather than the current catalog.
 */
/** Why an account stopped. `null` while it has not. */
export type Ending = "daily_loss" | "trailing_drawdown" | "news" | "target_met";

export type Account = {
  id: string;
  name: string;
  openedOn: string;
  status: AccountStatus;
  plan: Plan;
  balance: number;
  equity: number;
  peakEquity: number;
  sessionOpenEquity: number;
  /** Commission taken out of the balance so far. */
  feesPaid: number;
  endedAt: string | null;
  endedReason: Ending | null;
  journal: JournalDay[];
};

export const STATUS_LABEL: Record<AccountStatus, string> = {
  live: "Live",
  locked: "Locked",
  passed: "Passed",
  breached: "Breached",
};

export const STATUS_TONE = {
  live: "up",
  locked: "warn",
  passed: "accent",
  breached: "down",
} as const;

export const planOf = (account: Account): Plan => account.plan;

const rulesOf = (account: Account): AccountRules => ({
  startingBalanceCents: cents(account.plan.size),
  profitTargetCents: cents(account.plan.profitTarget),
  trailingDrawdownCents: cents(account.plan.trailingDrawdown),
  dailyLossLimitCents: cents(account.plan.dailyLossLimit),
  lockAboveStartCents: cents(account.plan.lockAboveStart),
});

/** The soft floor is measured from the day's open and resets with the session. */
export const dailyFloorOf = (account: Account) =>
  toDollars(dailyFloorCents(rulesOf(account), cents(account.sessionOpenEquity)));

/**
 * The hard floor is measured from peak equity and only rises. It stops
 * following a new peak once it reaches the locked floor, and never moves again.
 */
export const trailingFloorOf = (account: Account) =>
  toDollars(trailingFloorCents(rulesOf(account), cents(account.peakEquity)));

export const targetOf = (account: Account) => toDollars(targetCents(rulesOf(account)));

export const netPnlOf = (account: Account) => account.balance - account.plan.size;

/**
 * The equity at which the trailing floor stops following the peak. One of the
 * three numbers a trailing drawdown is made of, and the only one a trader can
 * do anything about: past it the floor never moves again.
 */
export const lockAtOf = (account: Account) =>
  account.plan.size + account.plan.lockAboveStart + account.plan.trailingDrawdown;

/** How much further the peak has to reach before the floor is fixed for good. */
export const toLockOf = (account: Account) => Math.max(0, lockAtOf(account) - account.peakEquity);

/** Equity, not balance: an open position counts against the session as it moves. */
export const dayPnlOf = (account: Account) => account.equity - account.sessionOpenEquity;

export const roomLeftOf = (equity: number, floor: number, limit: number) =>
  Math.min(1, Math.max(0, (equity - floor) / limit));

export const floorToneOf = (left: number): FloorTone => {
  if (left < 0.2) return "down";
  if (left < 0.4) return "warn";

  return "up";
};

export const totalsOf = (accounts: Account[]) => ({
  accounts: accounts.length,
  live: accounts.filter((account) => isOpen(account.status)).length,
  balance: accounts.reduce((total, account) => total + account.balance, 0),
  allocated: accounts.reduce((total, account) => total + account.plan.size, 0),
  netPnl: accounts.reduce((total, account) => total + netPnlOf(account), 0),
  dayPnl: accounts
    .filter((account) => isOpen(account.status))
    .reduce((total, account) => total + dayPnlOf(account), 0),
  trades: accounts.reduce(
    (total, account) => total + account.journal.reduce((sum, entry) => sum + entry.trades, 0),
    0,
  ),
});

const WORST: Verdict[] = ["clean", "watch", "breached"];

const worseOf = (a: Verdict, b: Verdict) => (WORST.indexOf(a) >= WORST.indexOf(b) ? a : b);

/** Every account's sessions folded onto one calendar, newest first. */
export const combinedJournalOf = (accounts: Account[]): JournalDay[] => {
  const byDate = new Map<string, JournalDay>();

  for (const account of accounts) {
    for (const day of account.journal) {
      const seen = byDate.get(day.date);

      if (!seen) {
        byDate.set(day.date, { ...day });
        continue;
      }

      seen.trades += day.trades;
      seen.wins += day.wins;
      seen.pnl += day.pnl;
      seen.worstDrawdown = Math.min(seen.worstDrawdown, day.worstDrawdown);
      seen.verdict = worseOf(seen.verdict, day.verdict);
    }
  }

  return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
};
