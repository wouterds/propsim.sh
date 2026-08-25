import { render, toPlainText } from "@react-email/components";
import { createElement, type ReactElement } from "react";

import { ConfirmCode } from "./emails/confirm-code";
import { Welcome } from "./emails/welcome";
import { send } from "./mailjet";

const deliver = async (to: string, subject: string, email: ReactElement) => {
  const html = await render(email);

  await send({ to, subject, html, text: toPlainText(html) });
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
