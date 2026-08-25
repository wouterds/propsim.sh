import type { FloorTone } from "./format";
import type { JournalDay, Verdict } from "./journal";
import { lockedFloorOf, type Plan, planOr } from "./plans";

export type AccountStatus = "live" | "passed" | "breached";

export type Account = {
  id: string;
  planId: string;
  name: string;
  openedOn: string;
  status: AccountStatus;
  balance: number;
  peakEquity: number;
  sessionOpenEquity: number;
  journal: JournalDay[];
};

export const STATUS_LABEL: Record<AccountStatus, string> = {
  live: "Live",
  passed: "Passed",
  breached: "Breached",
};

export const STATUS_TONE = { live: "up", passed: "accent", breached: "down" } as const;

const day = (
  date: string,
  trades: number,
  wins: number,
  worstDrawdown: number,
  pnl: number,
  verdict: JournalDay["verdict"] = "clean",
): JournalDay => ({ date, trades, wins, worstDrawdown, pnl, verdict });

export const ACCOUNTS: Account[] = [
  {
    id: "a-50k-01",
    planId: "daily-50k",
    name: "50K Daily",
    openedOn: "2026-08-10",
    status: "live",
    balance: 51_284,
    peakEquity: 51_640,
    sessionOpenEquity: 51_002,
    journal: [
      day("2026-08-25", 6, 4, -412, 282, "watch"),
      day("2026-08-24", 4, 3, -138, 466),
      day("2026-08-21", 9, 4, -806, -324, "watch"),
      day("2026-08-20", 3, 2, -92, 178),
      day("2026-08-19", 7, 5, -244, 391),
      day("2026-08-18", 5, 2, -520, -210),
      day("2026-08-17", 4, 3, -117, 501),
    ],
  },
  {
    id: "a-25k-01",
    planId: "daily-25k",
    name: "25K Daily",
    openedOn: "2026-08-18",
    status: "live",
    balance: 24_661.5,
    peakEquity: 25_182,
    sessionOpenEquity: 24_914,
    journal: [
      day("2026-08-25", 5, 2, -318, -252.5, "watch"),
      day("2026-08-24", 4, 3, -96, 160),
      day("2026-08-21", 9, 3, -588, -428, "watch"),
      day("2026-08-20", 3, 2, -74.5, 101.5),
      day("2026-08-19", 7, 4, -409, -181.5),
      day("2026-08-18", 5, 3, -122, 262),
    ],
  },
  {
    id: "a-100k-01",
    planId: "daily-100k",
    name: "100K Daily",
    openedOn: "2026-07-28",
    status: "breached",
    balance: 96_820,
    peakEquity: 99_820,
    sessionOpenEquity: 99_140,
    journal: [
      day("2026-08-14", 11, 3, -3_140, -2_320, "breached"),
      day("2026-08-13", 6, 4, -410, 512),
      day("2026-08-12", 4, 1, -880, -640),
      day("2026-08-11", 5, 4, -190, 728),
    ],
  },
  {
    id: "a-50k-00",
    planId: "daily-50k",
    name: "50K Daily",
    openedOn: "2026-07-06",
    status: "passed",
    balance: 53_140,
    peakEquity: 53_140,
    sessionOpenEquity: 53_140,
    journal: [
      day("2026-07-24", 5, 4, -180, 604),
      day("2026-07-23", 6, 4, -320, 442),
      day("2026-07-22", 4, 3, -96, 388),
      day("2026-07-21", 7, 4, -540, -212),
    ],
  },
];

export const planOf = (account: Account): Plan => planOr(account.planId);

export const findAccount = (id: string | undefined) =>
  ACCOUNTS.find((account) => account.id === id) ?? null;

export const liveAccounts = () => ACCOUNTS.filter((account) => account.status === "live");

/** The soft floor is measured from the day's open and resets with the session. */
export const dailyFloorOf = (account: Account) =>
  account.sessionOpenEquity - planOf(account).dailyLossLimit;

/**
 * The hard floor is measured from peak equity and only rises. It stops
 * following a new peak once it reaches the locked floor, and never moves again.
 */
export const trailingFloorOf = (account: Account) => {
  const plan = planOf(account);

  return Math.min(account.peakEquity - plan.trailingDrawdown, lockedFloorOf(plan));
};

export const targetOf = (account: Account) => planOf(account).size + planOf(account).profitTarget;

export const netPnlOf = (account: Account) => account.balance - planOf(account).size;

export const dayPnlOf = (account: Account) => account.balance - account.sessionOpenEquity;

export const roomLeftOf = (equity: number, floor: number, limit: number) =>
  Math.min(1, Math.max(0, (equity - floor) / limit));

export const floorToneOf = (left: number): FloorTone => {
  if (left < 0.2) return "down";
  if (left < 0.4) return "warn";

  return "up";
};

export const totalsOf = (accounts: Account[]) => ({
  accounts: accounts.length,
  live: accounts.filter((account) => account.status === "live").length,
  balance: accounts.reduce((total, account) => total + account.balance, 0),
  allocated: accounts.reduce((total, account) => total + planOf(account).size, 0),
  netPnl: accounts.reduce((total, account) => total + netPnlOf(account), 0),
  dayPnl: accounts
    .filter((account) => account.status === "live")
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

let created = 0;

/**
 * In memory only, so a new account lives until the server restarts. It is
 * enough to walk the flow while the shape of an account is still being decided.
 */
export const createAccount = (planId: string, openedOn: string): Account => {
  const plan = planOr(planId);
  created += 1;

  const account: Account = {
    id: `${plan.id}-${created}`,
    planId: plan.id,
    name: `${plan.label} Daily`,
    openedOn,
    status: "live",
    balance: plan.size,
    peakEquity: plan.size,
    sessionOpenEquity: plan.size,
    journal: [],
  };

  ACCOUNTS.unshift(account);

  return account;
};
