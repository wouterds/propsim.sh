import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type Message, send } from "./mailjet";

const message: Message = {
  to: "trader@example.com",
  subject: "Confirm your propsim email",
  html: "<p>048213</p>",
  text: "048213",
};

const accepted = {
  Messages: [{ Status: "success", To: [{ Email: message.to, MessageUUID: "cb927469" }] }],
};

const answer = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue({ status, json: () => Promise.resolve(body) });

beforeEach(() => {
  vi.stubEnv("MAILJET_API_KEY", "k");
  vi.stubEnv("MAILJET_API_SECRET", "s");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("send", () => {
  it("should throw when a message reports an error inside a 200", async () => {
    // given
    vi.stubGlobal(
      "fetch",
      answer(200, {
        Messages: [
          {
            Status: "error",
            Errors: [
              {
                ErrorCode: "send-0008",
                ErrorMessage: "From is not an authorized sender",
                ErrorRelatedTo: ["From"],
              },
            ],
          },
        ],
      }),
    );

    // when
    const sending = send(message);

    // then
    await expect(sending).rejects.toThrow(
      "Mailjet responded 200 for trader@example.com from noreply@propsim.sh: " +
        "send-0008 From is not an authorized sender",
    );
  });

  it("should throw when the body carries no messages array", async () => {
    // given
    vi.stubGlobal(
      "fetch",
      answer(401, {
        ErrorIdentifier: "5b3d2e1f",
        ErrorCode: "mj-0015",
        ErrorMessage: "API key authentication/authorization failure",
        StatusCode: 401,
      }),
    );

    // when
    const sending = send(message);

    // then
    await expect(sending).rejects.toThrow(
      "Mailjet responded 401 for trader@example.com from noreply@propsim.sh: " +
        "mj-0015 API key authentication/authorization failure",
    );
  });

  it("should throw with the status when the body is not JSON", async () => {
    // given
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 502,
        json: () => Promise.reject(new SyntaxError("Unexpected token <")),
      }),
    );

    // when
    const sending = send(message);

    // then
    await expect(sending).rejects.toThrow(
      "Mailjet responded 502 for trader@example.com from noreply@propsim.sh: unreadable body",
    );
  });

  it("should name both addresses when the request never answers", async () => {
    // given
    const aborted = new DOMException("The operation was aborted due to timeout", "TimeoutError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(aborted));

    // when
    const sending = send(message);

    // then
    await expect(sending).rejects.toThrow(
      "Mailjet unreachable for trader@example.com from noreply@propsim.sh: " +
        "The operation was aborted due to timeout",
    );
  });

  it("should refuse the tracking that rewrites links and adds a pixel", async () => {
    // given
    const fetched = answer(200, accepted);
    vi.stubGlobal("fetch", fetched);

    // when
    await send(message);

    // then
    const [, request] = fetched.mock.calls[0];
    const sent = JSON.parse(request.body).Messages[0];
    expect(sent.TrackClicks).toBe("disabled");
    expect(sent.TrackOpens).toBe("disabled");
  });

  it("should authorise with the key as the user and the secret as the password", async () => {
    // given
    const fetched = answer(200, accepted);
    vi.stubGlobal("fetch", fetched);

    // when
    await send(message);

    // then
    const [, request] = fetched.mock.calls[0];
    expect(request.headers.Authorization).toBe(`Basic ${Buffer.from("k:s").toString("base64")}`);
  });
});
