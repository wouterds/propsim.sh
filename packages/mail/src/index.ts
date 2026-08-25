import { render, toPlainText } from "@react-email/components";
import { createElement, type ReactElement } from "react";

import { AccountDeleted } from "./emails/account-deleted";
import { ConfirmCode } from "./emails/confirm-code";
import { ConfirmNewEmail } from "./emails/confirm-new-email";
import { ContactMessage } from "./emails/contact-message";
import { EmailChanging } from "./emails/email-changing";
import { NewDevice } from "./emails/new-device";
import { PasswordChanged } from "./emails/password-changed";
import { ResetPassword } from "./emails/reset-password";
import { Welcome } from "./emails/welcome";
import { send } from "./mailjet";

const deliver = async (
  to: string,
  subject: string,
  email: ReactElement,
  replyTo?: { email: string; name: string },
) => {
  const html = await render(email);

  await send({ to, subject, html, text: toPlainText(html), replyTo });
};

export const sendWelcome = ({ to }: { to: string }) =>
  deliver(to, "Welcome to propsim.sh", createElement(Welcome, { to }));

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
  deliver(to, "Reset your password", createElement(ResetPassword, { to, token, expiresInMinutes }));

export const sendPasswordChanged = ({ to }: { to: string }) =>
  deliver(to, "Your password was changed", createElement(PasswordChanged, { to }));

export const sendAccountDeleted = ({ to }: { to: string }) =>
  deliver(to, "Your account was deleted", createElement(AccountDeleted, { to }));

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
    to,
    "Confirm your new address",
    createElement(ConfirmNewEmail, { to, token, expiresInMinutes }),
  );

export const sendEmailChanging = ({ to, email }: { to: string; email: string }) =>
  deliver(to, "A new address was requested", createElement(EmailChanging, { to, email }));

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
}) => deliver(to, "A new device signed in", createElement(NewDevice, { to, device, place, at }));

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
    to,
    `Contact: ${subject}`,
    createElement(ContactMessage, { to, name, email, subject, message }),
    { email, name },
  );
