/** The CME roll. Everything printed from 17:00 CT belongs to the next date. */
export const SESSION_OPEN_HOUR = 17;

const CHICAGO = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
});

const partsOf = (at: Date) => {
  const found = new Map(CHICAGO.formatToParts(at).map((part) => [part.type, part.value]));

  return {
    year: Number(found.get("year")),
    month: Number(found.get("month")),
    day: Number(found.get("day")),
    hour: Number(found.get("hour")),
  };
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
