import { emailLogs, getDb } from "@propsim/database";

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
