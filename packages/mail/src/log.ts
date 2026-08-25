import { emailLogs, getDb } from "@propsim/database";
import { eq } from "drizzle-orm";

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

export const logEmail = ({
  recipient,
  subject,
  template,
  payload,
}: {
  recipient: string;
  subject: string;
  template: string;
  payload: object;
}) =>
  getDb()
    .insert(emailLogs)
    .values({ recipient, subject, template, payload: redact(payload) });

/**
 * The address is what ties a log row to somebody, and every payload repeats it,
 * so both go. Call it while the old address is still known.
 */
export const scrubEmailLogs = (recipient: string, anonymised: string) =>
  getDb()
    .update(emailLogs)
    .set({ recipient: anonymised, payload: null })
    .where(eq(emailLogs.recipient, recipient));
