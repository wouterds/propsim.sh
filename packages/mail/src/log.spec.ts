import { describe, expect, it, vi } from "vitest";

import { logEmail } from "./log";

const { values } = vi.hoisted(() => ({ values: vi.fn() }));

vi.mock("@propsim/database", () => ({
  emailLogs: {},
  getDb: () => ({ insert: () => ({ values }) }),
}));

describe("logEmail", () => {
  it("should keep a code and a token out of the stored payload", async () => {
    // given
    const payload = {
      to: "trader@example.com",
      code: "048213",
      token: "9f3c",
      expiresInMinutes: 10,
    };

    // when
    await logEmail({
      recipient: "trader@example.com",
      subject: "Confirm your email address",
      template: "confirm-code",
      payload,
    });

    // then
    expect(values).toHaveBeenCalledWith({
      recipient: "trader@example.com",
      subject: "Confirm your email address",
      template: "confirm-code",
      payload: {
        to: "trader@example.com",
        code: "[redacted]",
        token: "[redacted]",
        expiresInMinutes: 10,
      },
    });
  });

  it("should leave everything else readable", async () => {
    // given
    const payload = { to: "trader@example.com", device: "Safari on macOS", place: null };

    // when
    await logEmail({
      recipient: "trader@example.com",
      subject: "A new device signed in",
      template: "new-device",
      payload,
    });

    // then
    expect(values).toHaveBeenLastCalledWith(expect.objectContaining({ payload }));
  });
});
