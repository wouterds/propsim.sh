import type { Verdict } from "@propsim/engine";

export const VERDICT_TONE = { clean: "up", watch: "warn", breached: "down" } as const;

export const VERDICT_LABEL = { clean: "Clean", watch: "Watch", breached: "Breach" } as const;

export type JournalDay = {
  date: string;
  trades: number;
  wins: number;
  worstDrawdown: number;
  pnl: number;
  verdict: Verdict;
};

export const winRateOf = (days: JournalDay[]) => {
  const trades = days.reduce((total, day) => total + day.trades, 0);

  if (trades === 0) {
    return null;
  }

  return days.reduce((total, day) => total + day.wins, 0) / trades;
};

export const greenDaysOf = (days: JournalDay[]) => days.filter((day) => day.pnl > 0).length;

export const bestDayOf = (days: JournalDay[]) =>
  days.reduce<JournalDay | null>((best, day) => (best && best.pnl >= day.pnl ? best : day), null);

export const worstDayOf = (days: JournalDay[]) =>
  days.reduce<JournalDay | null>(
    (worst, day) => (worst && worst.pnl <= day.pnl ? worst : day),
    null,
  );
