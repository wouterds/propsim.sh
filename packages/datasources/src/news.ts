import { readCache, writeCache } from "./cache";
import { type CalendarRow, fetchCalendar } from "./forex-factory";

export type Impact = "high" | "medium" | "low" | "holiday" | "unknown";

export type NewsEvent = {
  id: string;
  title: string;
  /** Release time in milliseconds. */
  time: number;
  currency: string;
  impact: Impact;
};

const IMPACTS: Record<string, Impact> = {
  high: "high",
  medium: "medium",
  low: "low",
  holiday: "holiday",
};

const impactOf = (value: string | undefined): Impact =>
  IMPACTS[value?.trim().toLowerCase() ?? ""] ?? "unknown";

/** The red folder on the calendar, which is the one the rule is written against. */
export const isRedFolder = (event: NewsEvent) =>
  event.impact === "high" && event.currency === "USD";

export const toEvents = (rows: CalendarRow[]): NewsEvent[] => {
  const events: NewsEvent[] = [];

  for (const row of rows) {
    const title = row.title?.trim();
    const currency = row.country?.trim().toUpperCase();

    if (!title || !currency || !row.date) {
      continue;
    }

    const time = new Date(row.date).getTime();

    // "All Day" and tentative rows carry a date that does not parse, and a
    // window cannot be drawn around a release with no moment.
    if (!Number.isFinite(time)) {
      continue;
    }

    events.push({ id: `${time}-${title}`, title, time, currency, impact: impactOf(row.impact) });
  }

  return events.sort((a, b) => a.time - b.time);
};

// The calendar changes weekly and the feed throttles hard.
const FRESH_SECONDS = 15 * 60;

// A feed that is down should not blank the chart, so the last good calendar is
// kept far longer than the one that decides whether to fetch.
const LAST_SECONDS = 24 * 60 * 60;

const BACKOFF_SECONDS = 60;

const FRESH = "calendar:fresh";
const LAST = "calendar:last";

/** Never throws. An empty calendar is a chart without bands, not a broken page. */
export const getNewsEvents = async (): Promise<NewsEvent[]> => {
  const fresh = await readCache<NewsEvent[]>(FRESH);

  if (fresh) {
    return fresh;
  }

  try {
    const events = toEvents(await fetchCalendar());

    await writeCache(FRESH, events, FRESH_SECONDS);
    await writeCache(LAST, events, LAST_SECONDS);

    return events;
  } catch (cause) {
    console.error("Economic calendar unavailable", cause);

    // Held briefly under the fresh key so a dead feed is not asked again on
    // every request, and the last good calendar is what gets served meanwhile.
    const last = (await readCache<NewsEvent[]>(LAST)) ?? [];
    await writeCache(FRESH, last, BACKOFF_SECONDS);

    return last;
  }
};
