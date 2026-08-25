import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendConfirmCode, sendWelcome } from "./index";

const accepted = {
  Messages: [{ Status: "success", To: [{ Email: "trader@example.com", MessageUUID: "cb927469" }] }],
};

const captureSend = () => {
  const fetched = vi.fn().mockResolvedValue({
    status: 200,
    json: () => Promise.resolve(accepted),
  });

  vi.stubGlobal("fetch", fetched);

  return () => JSON.parse(fetched.mock.calls[0][1].body).Messages[0];
};

beforeEach(() => {
  vi.stubEnv("MAILJET_API_KEY", "k");
  vi.stubEnv("MAILJET_API_SECRET", "s");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("sendConfirmCode", () => {
  it("should put the code in both parts and keep it out of the subject", async () => {
    // given
    const sent = captureSend();

    // when
    await sendConfirmCode({ to: "trader@example.com", code: "048213", expiresInMinutes: 10 });

    // then
    const payload = sent();
    expect(payload.To).toEqual([{ Email: "trader@example.com" }]);
    expect(payload.HTMLPart).toContain("048213");
    expect(payload.TextPart).toContain("048213");
    expect(payload.Subject).not.toContain("048213");
  });
});

describe("sendWelcome", () => {
  it("should never link to something a mail client has to resolve itself", async () => {
    // given
    const sent = captureSend();

    // when
    await sendWelcome({ to: "trader@example.com" });

    // then
    const links = [...sent().HTMLPart.matchAll(/href="([^"]*)"/g)].map(([, href]) => href);
    expect(links.length).toBeGreaterThan(0);
    expect(
      links.every((href: string) => href.startsWith("https://") || href.startsWith("mailto:")),
    ).toBe(true);
  });
});
