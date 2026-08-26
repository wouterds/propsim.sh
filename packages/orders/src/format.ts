import { toDollars } from "@propsim/engine";

const MONEY = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/**
 * Named parts, never `dateStyle` and `timeStyle`. Intl refuses those alongside
 * `timeZoneName`, and it refuses at construction, so the throw takes down every
 * module that imports this one rather than the call that wanted a date.
 */
const CHICAGO = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

export const money = (cents: number) => MONEY.format(toDollars(cents));

/** The clock the session is cut on, so a mail names the hour the trader traded. */
export const chicagoTime = (at: number) => CHICAGO.format(new Date(at));
