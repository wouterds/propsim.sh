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

export const getNewsEvents = async () => toEvents(await fetchCalendar());
