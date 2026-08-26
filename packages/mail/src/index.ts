import { render, toPlainText } from "@react-email/components";
import { createElement, type ReactElement } from "react";

import { AccountBreached } from "./emails/account-breached";
import { AccountDeleted } from "./emails/account-deleted";
import { AccountNews } from "./emails/account-news";
import { ConfirmCode } from "./emails/confirm-code";
import { ConfirmNewEmail } from "./emails/confirm-new-email";
import { ContactMessage } from "./emails/contact-message";
import { EmailChanging } from "./emails/email-changing";
import { Inactivity } from "./emails/inactivity";
import { NewDevice } from "./emails/new-device";
import { NewsWarning, type NewsWarningProps } from "./emails/news-warning";
import { PasswordChanged } from "./emails/password-changed";
import { ResetPassword } from "./emails/reset-password";
import { Welcome } from "./emails/welcome";
import { logEmail, logEmails } from "./log";
import { BATCH, type Refusal, send, sendBatch } from "./mailjet";

export { scrubEmailLogs } from "./log";
export { BATCH, type Refusal } from "./mailjet";

const deliver = async (
  template: string,
  to: string,
  subject: string,
  email: ReactElement<object>,
  replyTo?: { email: string; name: string },
) => {
  const html = await render(email);

  await send({ to, subject, html, text: toPlainText(html), replyTo });
  await logEmail({ recipient: to, subject, template, payload: email.props });
};

export const sendWelcome = ({ to }: { to: string }) =>
  deliver("welcome", to, "Welcome to propsim.sh", createElement(Welcome, { to }));

export const sendConfirmCode = ({
  to,
  code,
  expiresInMinutes,
}: {
  to: string;
  code: string;
  expiresInMinutes: number;
}) =>
  // The code stays out of the subject. Mailjet keeps subjects in message history, and
  // every relay on the path logs them.
  deliver(
    "confirm-code",
    to,
    "Confirm your email address",
    createElement(ConfirmCode, { to, code, expiresInMinutes }),
  );

export const sendResetPassword = ({
  to,
  token,
  expiresInMinutes,
}: {
  to: string;
  token: string;
  expiresInMinutes: number;
}) =>
  deliver(
    "reset-password",
    to,
    "Reset your password",
    createElement(ResetPassword, { to, token, expiresInMinutes }),
  );

export const sendPasswordChanged = ({ to }: { to: string }) =>
  deliver(
    "password-changed",
    to,
    "Your password was changed",
    createElement(PasswordChanged, { to }),
  );

export const sendAccountBreached = ({
  to,
  account,
  href,
  equity,
  floor,
}: {
  to: string;
  account: string;
  href: string;
  equity: string;
  floor: string;
}) =>
  deliver(
    "account-breached",
    to,
    `${account} is breached`,
    createElement(AccountBreached, { to, account, href, equity, floor }),
  );

export const sendAccountNews = ({
  to,
  account,
  href,
  release,
  at,
}: {
  to: string;
  account: string;
  href: string;
  release: string;
  at: string;
}) =>
  deliver(
    "account-news",
    to,
    `${account} is breached`,
    createElement(AccountNews, { to, account, href, release, at }),
  );

export const sendAccountDeleted = ({ to }: { to: string }) =>
  deliver("account-deleted", to, "Your account was deleted", createElement(AccountDeleted, { to }));

export const sendInactivityNotice = ({ to, daysLeft }: { to: string; daysLeft: number }) =>
  deliver(
    "inactivity",
    to,
    `Your account will be deleted in ${daysLeft} days`,
    createElement(Inactivity, { to, daysLeft }),
  );

export const sendConfirmNewEmail = ({
  to,
  token,
  expiresInMinutes,
}: {
  to: string;
  token: string;
  expiresInMinutes: number;
}) =>
  deliver(
    "confirm-new-email",
    to,
    "Confirm your new address",
    createElement(ConfirmNewEmail, { to, token, expiresInMinutes }),
  );

export const sendEmailChanging = ({ to, email }: { to: string; email: string }) =>
  deliver(
    "email-changing",
    to,
    "A new address was requested",
    createElement(EmailChanging, { to, email }),
  );

export const sendNewDevice = ({
  to,
  device,
  place,
  at,
}: {
  to: string;
  device: string;
  place: string | null;
  at: string;
}) =>
  deliver(
    "new-device",
    to,
    "A new device signed in",
    createElement(NewDevice, { to, device, place, at }),
  );

export const sendContactMessage = ({
  to,
  name,
  email,
  subject,
  message,
}: {
  to: string;
  name: string;
  email: string;
  subject: string;
  message: string;
}) =>
  deliver(
    "contact-message",
    to,
    `Contact: ${subject}`,
    createElement(ContactMessage, { to, name, email, subject, message }),
    { email, name },
  );

/**
 * One notice to a whole batch in one request, rather than one request each.
 * Rendering is per address because the footer names it, but that is local work
 * and the round trip is not.
 *
 * Only what Mailjet accepted is written to the log, so the sweep that reads the
 * log back does not count a refused address as told. Hand it at most `BATCH`.
 */
export const sendNewsWarning = async (
  recipients: string[],
  notice: Omit<NewsWarningProps, "to">,
  key: object,
): Promise<Refusal[]> => {
  const subject = `Red folder news at ${notice.at} Chicago time`;
  const messages = await Promise.all(
    recipients.slice(0, BATCH).map(async (to) => {
      const html = await render(createElement(NewsWarning, { ...notice, to }));

      return { to, subject, html, text: toPlainText(html) };
    }),
  );

  const refused = await sendBatch(messages);
  const failed = new Set(refused.map((one) => one.to));

  await logEmails(
    messages
      .filter((message) => !failed.has(message.to))
      .map((message) => ({
        recipient: message.to,
        subject,
        template: "news-warning",
        payload: { ...notice, ...key },
      })),
  );

  return refused;
};
