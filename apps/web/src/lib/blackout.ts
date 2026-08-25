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
