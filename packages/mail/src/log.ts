import { emailLogs, getDb } from "@propsim/database";
import { and, eq, gte } from "drizzle-orm";

// A reset link and a confirmation code are held as a hash everywhere else. The
// log must not be the one place that keeps them readable.
const SECRETS = ["code", "token"];

const redact = (payload: object) =>
  Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      SECRETS.includes(key) ? "[redacted]" : value,
    ]),
  );

type Entry = {
  recipient: string;
  subject: string;
  template: string;
  payload: object;
};

export const logEmail = (entry: Entry) => logEmails([entry]);

/** One insert for a whole batch, so a broadcast costs one round trip and not one each. */
export const logEmails = async (entries: Entry[]) => {
  if (entries.length === 0) {
    return;
  }

  await getDb()
    .insert(emailLogs)
    .values(entries.map((entry) => ({ ...entry, payload: redact(entry.payload) })));
};

/**
 * The address is what ties a log row to somebody, and every payload repeats it,
 * so both go. Call it while the old address is still known.
 */
export const scrubEmailLogs = (recipient: string, anonymised: string) =>
  getDb()
    .update(emailLogs)
    .set({ recipient: anonymised, payload: null })
    .where(eq(emailLogs.recipient, recipient));

/**
 * What this template has already sent since `since`, so a sweep that runs on a
 * timer can work out who it has already told. The log is written after every
 * send, which makes it the record of what went out and the guard against a
 * second one, without a column anywhere to remember it by.
 */
export const emailsSent = (template: string, since: Date) =>
  getDb()
    .select({ recipient: emailLogs.recipient, payload: emailLogs.payload })
    .from(emailLogs)
    .where(and(eq(emailLogs.template, template), gte(emailLogs.createdAt, since)));
