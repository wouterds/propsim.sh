import type { Fill } from "./fills";

export type NewsWindow = {
  from: number;
  to: number;
  /** The first release in the window, which is where the line goes. */
  at: number;
  titles: string[];
};

export type NewsMoment = {
  /** Release time in milliseconds. */
  time: number;
  title: string;
};

// On a daily payout account this ends the account, not the day.
export const BEFORE_MINUTES = 1;
export const AFTER_MINUTES = 1;

const minute = 60_000;

/** Overlapping windows merge, so releases at the same time read as one span. */
export const windowsOf = (events: NewsMoment[]): NewsWindow[] => {
  const sorted = [...events].sort((a, b) => a.time - b.time);
  const windows: NewsWindow[] = [];

  for (const event of sorted) {
    const from = event.time - BEFORE_MINUTES * minute;
    const to = event.time + AFTER_MINUTES * minute;
    const open = windows.at(-1);

    if (open && from <= open.to) {
      open.to = Math.max(open.to, to);
      open.titles.push(event.title);
      continue;
    }

    windows.push({ from, to, at: event.time, titles: [event.title] });
  }

  return windows;
};

/** Both edges count as inside. */
export const activeWindow = (windows: NewsWindow[], now: number) =>
  windows.find((window) => now >= window.from && now <= window.to) ?? null;

/** The next one that has not opened yet. */
export const nextWindow = (windows: NewsWindow[], now: number) =>
  windows.find((window) => window.from > now) ?? null;

/** A stretch the account was not flat. Open ended while it still is not. */
export type Held = { from: number; to: number | null };

/**
 * Every stretch the account held something, from the fills alone. Going flat
 * and opening again is two stretches, never one, or a window between them would
 * read as traded through.
 */
export const heldSpansOf = (fills: Fill[]): Held[] => {
  const ordered = [...fills].sort((a, b) => a.at.getTime() - b.at.getTime());
  const net = new Map<string, number>();
  const spans: Held[] = [];
  let open: Held | null = null;

  for (const fill of ordered) {
    const signed = fill.side === "buy" ? fill.quantity : -fill.quantity;

    net.set(fill.instrument, (net.get(fill.instrument) ?? 0) + signed);

    // Flat means flat across every contract, not just the one that printed.
    const holding = [...net.values()].some((quantity) => quantity !== 0);

    if (holding && !open) {
      open = { from: fill.at.getTime(), to: null };
      spans.push(open);
      continue;
    }

    if (!holding && open) {
      open.to = fill.at.getTime();
      open = null;
    }
  }

  return spans;
};

/**
 * The first window the account was not flat through, which on a daily payout
 * account ends it. A position opened and closed inside one still counts: the
 * rule is to be flat, not to avoid finishing the window in a trade.
 *
 * A position still open runs to `now`, so a window that has not opened yet
 * cannot be breached by it.
 */
export const heldThroughOf = (
  fills: Fill[],
  windows: NewsWindow[],
  now: number,
): NewsWindow | null =>
  windows.find((window) =>
    heldSpansOf(fills).some((span) => span.from <= window.to && (span.to ?? now) >= window.from),
  ) ?? null;
