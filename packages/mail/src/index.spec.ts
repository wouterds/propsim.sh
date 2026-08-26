import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendAccountBreached, sendConfirmCode, sendNewsWarning, sendWelcome } from "./index";

// These cover what Mailjet is handed. The log is specced against its own module.
vi.mock("./log", () => ({ logEmail: vi.fn(), logEmails: vi.fn(), scrubEmailLogs: vi.fn() }));

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

/** Answers a batch, marking the addresses named in `refuse` as rejected. */
const captureBatch = (refuse: string[] = []) => {
  const fetched = vi.fn().mockImplementation((_url, request) => {
    const messages = JSON.parse(request.body).Messages as { To: { Email: string }[] }[];

    return Promise.resolve({
      status: 200,
      json: () =>
        Promise.resolve({
          Messages: messages.map((message) =>
            refuse.includes(message.To[0].Email)
              ? { Status: "error", Errors: [{ ErrorCode: "mj-0013", ErrorMessage: "invalid" }] }
              : { Status: "success" },
          ),
        }),
    });
  });

  vi.stubGlobal("fetch", fetched);

  return fetched;
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

describe("sendAccountBreached", () => {
  it("should name the trailing drawdown and never the daily limit", async () => {
    // given the only floor that can close an account
    const sent = captureSend();

    // when
    await sendAccountBreached({
      to: "trader@example.com",
      account: "50K Daily",
      equity: "$48,000.00",
      floor: "$48,000.00",
    });

    // then naming the daily limit here would tell a trader their account is
    // gone over a rule that only ever ends their day
    const payload = sent();
    expect(payload.HTMLPart).toContain("trailing drawdown");
    expect(payload.HTMLPart).not.toContain("daily loss limit");
    expect(payload.TextPart).toContain("$48,000.00");
  });
});

const NOTICE = {
  releases: ["Core PCE Price Index m/m"],
  at: "7:30:00 AM",
  date: "Wednesday, August 26",
  opens: "7:29:00 AM",
  closes: "7:31:00 AM",
};

describe("sendNewsWarning", () => {
  it("should put a whole batch in one request", async () => {
    // given three addresses to warn about the same release
    const fetched = captureBatch();

    // when
    const refused = await sendNewsWarning(
      ["a@example.com", "b@example.com", "c@example.com"],
      NOTICE,
      {
        release: 1,
      },
    );

    // then one round trip carries all three, not one each
    expect(fetched).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetched.mock.calls[0][1].body).Messages).toHaveLength(3);
    expect(refused).toEqual([]);
  });

  it("should name the address Mailjet rejected and keep the rest", async () => {
    // given a batch where the middle address is refused
    captureBatch(["b@example.com"]);

    // when
    const refused = await sendNewsWarning(
      ["a@example.com", "b@example.com", "c@example.com"],
      NOTICE,
      {
        release: 1,
      },
    );

    // then reading the answer by position is the whole point: taking the first
    // status for every message would call the batch good and never tell anyone
    expect(refused).toHaveLength(1);
    expect(refused[0]?.to).toBe("b@example.com");
  });

  it("should address each message to one recipient and nobody else", async () => {
    // given a batch
    const fetched = captureBatch();

    // when
    await sendNewsWarning(["a@example.com", "b@example.com"], NOTICE, { release: 1 });

    // then a shared To would show every trader who else holds an account here
    const sent = JSON.parse(fetched.mock.calls[0][1].body).Messages;
    expect(sent[0].To).toEqual([{ Email: "a@example.com" }]);
    expect(sent[1].To).toEqual([{ Email: "b@example.com" }]);
  });
});
