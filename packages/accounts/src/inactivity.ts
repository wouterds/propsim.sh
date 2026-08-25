/** Nobody has signed in for this long, so the first notice goes out. */
export const WARN_AFTER_DAYS = 30;

/** Still nothing, and the account has a month left. */
export const FINAL_AFTER_DAYS = 60;

/** The account is emptied. */
export const SCRUB_AFTER_DAYS = 90;

export type Stage = "active" | "warn" | "final" | "scrub";

const DAY = 24 * 60 * 60 * 1000;

export const daysSince = (at: Date, now: Date) => Math.floor((now.getTime() - at.getTime()) / DAY);

/** What is owed to an account whose last sign in was `lastSeenAt`. */
export const stageOf = (lastSeenAt: Date, now: Date): Stage => {
  const days = daysSince(lastSeenAt, now);

  if (days >= SCRUB_AFTER_DAYS) {
    return "scrub";
  }

  if (days >= FINAL_AFTER_DAYS) {
    return "final";
  }

  if (days >= WARN_AFTER_DAYS) {
    return "warn";
  }

  return "active";
};

/** How long the account has before it is emptied, for the notice to say. */
export const daysLeft = (lastSeenAt: Date, now: Date) =>
  Math.max(0, SCRUB_AFTER_DAYS - daysSince(lastSeenAt, now));
