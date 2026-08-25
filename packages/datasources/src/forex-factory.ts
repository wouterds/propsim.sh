const CALENDAR = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";

const TIMEOUT = 10_000;

/**
 * The rows carry an offset, so the string is absolute rather than a wall clock.
 * `impact` is a word, and an unlisted one is treated as unknown rather than low.
 */
export type CalendarRow = {
  title?: string;
  country?: string;
  date?: string;
  impact?: string;
};

export const fetchCalendar = async (): Promise<CalendarRow[]> => {
  const response = await fetch(CALENDAR, {
    headers: { "User-Agent": "propsim.sh (+https://propsim.sh)" },
    signal: AbortSignal.timeout(TIMEOUT),
  });

  // A throttled response is an HTML page. Without this the parse reports a
  // syntax error instead of the status.
  if (!response.ok) {
    throw new Error(`Forex Factory responded ${response.status}`);
  }

  const payload = (await response.json()) as unknown;

  if (!Array.isArray(payload)) {
    throw new Error("Forex Factory served no calendar");
  }

  return payload as CalendarRow[];
};
