import { render } from "@react-email/components";
import { createElement } from "react";
import { expect, it } from "vitest";
import { ResetPassword } from "./emails/reset-password";

it("should paint the button so a dark mode client cannot repaint it", async () => {
  // given
  const html = await render(
    createElement(ResetPassword, { to: "you@example.com", token: "abc", expiresInMinutes: 60 }),
  );

  // then
  expect(html).toContain('bgcolor="#2563eb"');
  expect(html).toContain("background-image:linear-gradient(#2563eb, #2563eb)");
});
