const ENDPOINT = "https://api.mailjet.com/v3.1/send";

const FROM = { Email: "noreply@propsim.sh", Name: "propsim.sh" };

const TIMEOUT = 10_000;

export type Message = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Set so a reply reaches the person who wrote, not the unattended sender. */
  replyTo?: { email: string; name: string };
};

type MailjetError = {
  ErrorCode: string;
  ErrorMessage: string;
  ErrorRelatedTo?: string[];
};

type SendPayload = {
  Messages?: { Status: string; Errors?: MailjetError[] }[];
  ErrorCode?: string;
  ErrorMessage?: string;
};

const required = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set`);
  }

  return value;
};

const reason = (payload: SendPayload | null, index = 0) => {
  if (!payload) {
    return "unreadable body";
  }

  const errors = payload.Messages?.[index]?.Errors;

  if (errors?.length) {
    return errors.map((error) => `${error.ErrorCode} ${error.ErrorMessage}`).join("; ");
  }

  if (payload.ErrorCode) {
    return `${payload.ErrorCode} ${payload.ErrorMessage}`;
  }

  return "no error reported";
};

const shape = (message: Message) => ({
  From: FROM,
  To: [{ Email: message.to }],
  ...(message.replyTo && {
    ReplyTo: { Email: message.replyTo.email, Name: message.replyTo.name },
  }),
  Subject: message.subject,
  TextPart: message.text,
  HTMLPart: message.html,
  // Click tracking rewrites every href to a plain http mailjet domain, so a
  // confirmation link stops naming where it goes. Open tracking adds a pixel.
  // Neither belongs in mail the account itself depends on.
  TrackOpens: "disabled",
  TrackClicks: "disabled",
});

const post = (messages: Message[]) => ({
  method: "POST",
  headers: {
    Authorization: `Basic ${Buffer.from(
      `${required("MAILJET_API_KEY")}:${required("MAILJET_API_SECRET")}`,
    ).toString("base64")}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ Messages: messages.map(shape) }),
  signal: AbortSignal.timeout(TIMEOUT),
});

export const send = async (message: Message) => {
  const request = post([message]);

  // A timeout rejects fetch itself, with a message that names neither address.
  const response = await fetch(ENDPOINT, request).catch((error: Error) => {
    throw new Error(`Mailjet unreachable for ${message.to} from ${FROM.Email}: ${error.message}`);
  });

  const payload = (await response.json().catch(() => null)) as SendPayload | null;

  // Mailjet reports a rejected sender and a rejected recipient inside a 200, and
  // answers an auth failure with no Messages at all. The status alone is not the answer.
  if (payload?.Messages?.[0]?.Status !== "success") {
    throw new Error(
      `Mailjet responded ${response.status} for ${message.to} from ${FROM.Email}: ${reason(payload)}`,
    );
  }
};

/** Mailjet takes fifty messages in one request and refuses the fifty first. */
export const BATCH = 50;

export type Refusal = { to: string; reason: string };

/**
 * One request for a whole batch. Mailjet answers per message, so a rejected
 * address comes back rather than throwing: the rest of the batch was accepted
 * and the caller has to know which of them to write down as sent.
 *
 * A request that never lands still throws, because nothing in it was sent.
 */
export const sendBatch = async (messages: Message[]): Promise<Refusal[]> => {
  if (messages.length === 0) {
    return [];
  }

  const response = await fetch(ENDPOINT, post(messages)).catch((error: Error) => {
    throw new Error(`Mailjet unreachable for ${messages.length} messages: ${error.message}`);
  });

  const payload = (await response.json().catch(() => null)) as SendPayload | null;

  // No Messages at all is how an auth failure answers, and it means none of
  // them went, not that all of them did.
  return messages.flatMap((message, index) =>
    payload?.Messages?.[index]?.Status === "success"
      ? []
      : [{ to: message.to, reason: reason(payload, index) }],
  );
};
