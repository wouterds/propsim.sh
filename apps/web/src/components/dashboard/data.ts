export type Verdict = "clean" | "watch" | "breached";

export type Session = {
  id: string;
  date: string;
  weekday: string;
  trades: number;
  worstEquity: number;
  pnl: number;
  verdict: Verdict;
  note: string;
};

export type Rule = {
  id: string;
  label: string;
  detail: string;
  state: Verdict;
};

export const SESSIONS: Session[] = [
  {
    id: "2026-08-25",
    date: "25 Aug",
    weekday: "Mon",
    trades: 5,
    worstEquity: -318,
    pnl: -252.5,
    verdict: "watch",
    note: "Open",
  },
  {
    id: "2026-08-22",
    date: "22 Aug",
    weekday: "Fri",
    trades: 4,
    worstEquity: -96,
    pnl: 160,
    verdict: "clean",
    note: "Closed 15:02",
  },
  {
    id: "2026-08-21",
    date: "21 Aug",
    weekday: "Thu",
    trades: 9,
    worstEquity: -588,
    pnl: -428,
    verdict: "watch",
    note: "12.00 off the floor",
  },
  {
    id: "2026-08-20",
    date: "20 Aug",
    weekday: "Wed",
    trades: 3,
    worstEquity: -74.5,
    pnl: 101.5,
    verdict: "clean",
    note: "Closed 13:47",
  },
  {
    id: "2026-08-19",
    date: "19 Aug",
    weekday: "Tue",
    trades: 7,
    worstEquity: -409,
    pnl: -181.5,
    verdict: "clean",
    note: "Closed 15:08",
  },
  {
    id: "2026-08-18",
    date: "18 Aug",
    weekday: "Mon",
    trades: 5,
    worstEquity: -122,
    pnl: 262,
    verdict: "clean",
    note: "Closed 14:20",
  },
];

export const RULES: Rule[] = [
  {
    id: "daily",
    label: "Daily loss limit",
    detail: "600.00 from the session open, reset at 17:00 CT.",
    state: "clean",
  },
  {
    id: "trailing",
    label: "Trailing drawdown",
    detail: "1,000.00 from peak equity of 25,182.00. Never resets.",
    state: "clean",
  },
  {
    id: "target",
    label: "Profit target",
    detail: "1,838.50 left to reach 26,500.00.",
    state: "watch",
  },
  {
    id: "days",
    label: "Minimum trading days",
    detail: "6 traded, 3 required.",
    state: "clean",
  },
  {
    id: "consistency",
    label: "Consistency, 40%",
    detail: "Best day is 262.00. Applies once the account is in profit.",
    state: "watch",
  },
];

export const VERDICT_TONE = { clean: "up", watch: "warn", breached: "down" } as const;

export const VERDICT_LABEL = { clean: "Clean", watch: "Watch", breached: "Breach" } as const;
