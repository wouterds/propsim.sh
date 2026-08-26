import { render, toPlainText } from "@react-email/components";
import { createElement, type ReactElement } from "react";

import { AccountBreached, type BreachReason } from "./emails/account-breached";
import { AccountDeleted } from "./emails/account-deleted";
import { ConfirmCode } from "./emails/confirm-code";
import { ConfirmNewEmail } from "./emails/confirm-new-email";
import { ContactMessage } from "./emails/contact-message";
import { EmailChanging } from "./emails/email-changing";
import { Inactivity } from "./emails/inactivity";
import { NewDevice } from "./emails/new-device";
import { PasswordChanged } from "./emails/password-changed";
import { ResetPassword } from "./emails/reset-password";
import { Welcome } from "./emails/welcome";
import { logEmail } from "./log";
import { send } from "./mailjet";

export { scrubEmailLogs } from "./log";

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
  reason,
  equity,
  floor,
}: {
  to: string;
  account: string;
  reason: BreachReason;
  equity: string;
  floor: string;
}) =>
  deliver(
    "account-breached",
    to,
    `${account} is closed`,
    createElement(AccountBreached, { to, account, reason, equity, floor }),
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
