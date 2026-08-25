import type { FloorTone } from "./format";

export type Account = {
  id: string;
  name: string;
  phase: string;
  startingBalance: number;
  balance: number;
  peakEquity: number;
  sessionOpenEquity: number;
  dailyLossLimit: number;
  trailingDrawdown: number;
  profitTarget: number;
  minimumDays: number;
  daysTraded: number;
};

// The one account. The dashboard, the nav and the terminal all read it, so a
// number changed here moves all three.
export const ACCOUNT: Account = {
  id: "MNQ-25K-EVAL",
  name: "Evaluation, 25K",
  phase: "Phase 1",
  startingBalance: 25_000,
  balance: 24_661.5,
  peakEquity: 25_182,
  sessionOpenEquity: 24_914,
  dailyLossLimit: 600,
  trailingDrawdown: 1_000,
  profitTarget: 26_500,
  minimumDays: 3,
  daysTraded: 6,
};

// The soft floor is measured from the day's open and resets with the session.
export const dailyFloorOf = (account: Account) =>
  account.sessionOpenEquity - account.dailyLossLimit;

// The hard floor is measured from peak equity and only rises.
export const trailingFloorOf = (account: Account) => account.peakEquity - account.trailingDrawdown;

// Shared so the landing card and the dashboard cannot show different tones for
// the same floor.
export const roomLeftOf = (equity: number, floor: number, limit: number) =>
  Math.min(1, Math.max(0, (equity - floor) / limit));

export const floorToneOf = (left: number): FloorTone => {
  if (left < 0.2) return "down";
  if (left < 0.4) return "warn";

  return "up";
};
