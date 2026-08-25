const ENDPOINT = "https://api.mailjet.com/v3.1/send";

const FROM = "noreply@propsim.sh";

const TIMEOUT = 10_000;

export type Message = {
  to: string;
  subject: string;
  html: string;
  text: string;
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

const reason = (payload: SendPayload | null) => {
  if (!payload) {
    return "unreadable body";
  }

  const errors = payload.Messages?.[0]?.Errors;

  if (errors?.length) {
    return errors.map((error) => `${error.ErrorCode} ${error.ErrorMessage}`).join("; ");
  }

  if (payload.ErrorCode) {
    return `${payload.ErrorCode} ${payload.ErrorMessage}`;
  }

  return "no error reported";
};

export const send = async (message: Message) => {
  const credentials = `${required("MAILJET_API_KEY")}:${required("MAILJET_API_SECRET")}`;

  const request = {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(credentials).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Messages: [
        {
          From: { Email: FROM },
          To: [{ Email: message.to }],
          Subject: message.subject,
          TextPart: message.text,
          HTMLPart: message.html,
        },
      ],
    }),
    signal: AbortSignal.timeout(TIMEOUT),
  };

  // A timeout rejects fetch itself, with a message that names neither address.
  const response = await fetch(ENDPOINT, request).catch((error: Error) => {
    throw new Error(`Mailjet unreachable for ${message.to} from ${FROM}: ${error.message}`);
  });

  const payload = (await response.json().catch(() => null)) as SendPayload | null;

  // Mailjet reports a rejected sender and a rejected recipient inside a 200, and
  // answers an auth failure with no Messages at all. The status alone is not the answer.
  if (payload?.Messages?.[0]?.Status !== "success") {
    throw new Error(
      `Mailjet responded ${response.status} for ${message.to} from ${FROM}: ${reason(payload)}`,
    );
  }
};
