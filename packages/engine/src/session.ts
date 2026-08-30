import type { Printed } from "./dance";

/** The CME roll. Everything printed from 17:00 CT belongs to the next date. */
export const SESSION_OPEN_HOUR = 17;

/** Flat by 16:45 New York, which is a quarter to four in Chicago. */
const SESSION_CLOSE_HOUR = 15;
const SESSION_CLOSE_MINUTE = 45;

const CHICAGO = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const partsOf = (at: Date) => {
  const found = new Map(CHICAGO.formatToParts(at).map((part) => [part.type, part.value]));

  return {
    year: Number(found.get("year")),
    month: Number(found.get("month")),
    day: Number(found.get("day")),
    weekday: found.get("weekday") ?? "",
    hour: Number(found.get("hour")),
    minute: Number(found.get("minute")),
  };
};

/**
 * Whether a ticket can print at this instant. Shut from the close until the
 * roll every weekday, and from Friday's close until Sunday's roll.
 */
export const isOpenAt = (at: Date) => {
  const { weekday, hour, minute } = partsOf(at);
  const sinceMidnight = hour * 60 + minute;
  const closed = sinceMidnight >= SESSION_CLOSE_HOUR * 60 + SESSION_CLOSE_MINUTE;
  const rolled = hour >= SESSION_OPEN_HOUR;

  if (weekday === "Sat") return false;
  if (weekday === "Sun") return rolled;
  if (weekday === "Fri") return !closed;

  return !closed || rolled;
};

type Close = {
  /** The first step shown while the session was shut. */
  at: number;
  /** The last step shown while it was open, or null when nothing was. */
  last: Printed | null;
};

/**
 * Where the tape crossed the close, reading the steps from `from` on. Null
 * while every step shown is still inside the session.
 */
export const closeStepOf = (steps: Printed[], from: number): Close | null => {
  let last: Printed | null = null;

  for (const step of [...steps].sort((a, b) => a.time - b.time)) {
    if (step.time < from) {
      continue;
    }

    if (!isOpenAt(new Date(step.time))) {
      return { at: step.time, last };
    }

    last = step;
  }

  return null;
};

/**
 * Read off a Chicago wall clock rather than by shifting the instant, so the two
 * days a year that are 23 or 25 hours long still cut in the same place.
 */
export const tradeDateOf = (at: Date) => {
  const { year, month, day, hour } = partsOf(at);
  const rolled = Date.UTC(year, month - 1, day + (hour >= SESSION_OPEN_HOUR ? 1 : 0));

  return new Date(rolled).toISOString().slice(0, 10);
};
