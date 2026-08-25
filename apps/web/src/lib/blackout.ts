export type NewsWindow = {
  from: number;
  to: number;
  titles: string[];
};

export type NewsMoment = {
  /** Release time in milliseconds. */
  time: number;
  title: string;
};

// Flat from a minute before to a minute after the release. This is the window
// the funded firms hold you to, and on a daily payout account breaching it ends
// the account rather than the day.
export const BEFORE_MINUTES = 1;
export const AFTER_MINUTES = 1;

const minute = 60_000;

/**
 * Overlapping windows are merged, so two releases at the same time read as one
 * span rather than two bands drawn on top of each other.
 */
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

    windows.push({ from, to, titles: [event.title] });
  }

  return windows;
};

/** Both edges count. A fill on the boundary is inside the window, not outside it. */
export const activeWindow = (windows: NewsWindow[], now: number) =>
  windows.find((window) => now >= window.from && now <= window.to) ?? null;

export const nextWindow = (windows: NewsWindow[], now: number) =>
  windows.find((window) => window.from > now) ?? null;
