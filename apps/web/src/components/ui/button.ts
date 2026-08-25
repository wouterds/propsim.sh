const BASE =
  "inline-flex items-center justify-center rounded font-medium text-sm transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-60";

/** The one thing the page wants you to do. */
export const PRIMARY = `${BASE} h-10 bg-accent-strong px-5 text-ink hover:bg-accent-strong/85`;

/** Beside a primary, and the same size as it so the pair reads as a pair. */
export const SECONDARY = `${BASE} h-10 border border-line px-5 text-muted hover:border-line-strong hover:bg-overlay hover:text-ink`;

export const PRIMARY_SM = `${BASE} h-9 bg-accent-strong px-4 text-ink hover:bg-accent-strong/85`;

export const SECONDARY_SM = `${BASE} h-9 border border-line px-4 text-muted hover:border-line-strong hover:bg-overlay hover:text-ink`;

/** The one thing on the page that cannot be undone. */
export const DANGER = `${BASE} h-9 bg-down px-4 text-sunken hover:bg-down/85`;

/** What opens the confirmation, rather than what carries it out. */
export const DANGER_SM = `${BASE} h-9 border border-down/40 px-4 text-down hover:bg-down/10`;
