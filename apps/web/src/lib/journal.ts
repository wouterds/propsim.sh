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

/**
 * Largest single day profit over account profit, which is the formula the firms
 * publish. The denominator is net, so a losing day makes the share worse.
 */
export const concentrationOf = (days: JournalDay[]) => {
  const profit = days.reduce((total, day) => total + day.pnl, 0);
  const best = bestDayOf(days);

  if (profit <= 0 || !best || best.pnl <= 0) {
    return null;
  }

  return best.pnl / profit;
};
