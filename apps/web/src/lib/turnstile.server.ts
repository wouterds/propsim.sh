import { readOrigin } from "./origin.server";

const VERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const TIMEOUT = 10_000;

export const FIELD = "cf-turnstile-response";

export const turnstileIsSet = () =>
  Boolean(process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET);

export const siteKey = () => process.env.TURNSTILE_SITE_KEY ?? null;

type Verdict = { success?: boolean; "error-codes"?: string[] };

/**
 * Called from the server with the secret, never from the browser. A token is
 * good for one check, so a refused answer needs a fresh widget solve.
 */
export const passedTurnstile = async (request: Request, token: string) => {
  const secret = process.env.TURNSTILE_SECRET;

  if (!secret) {
    throw new Error("TURNSTILE_SECRET is not set");
  }

  if (!token) {
    return false;
  }

  const origin = readOrigin(request);
  const body = new URLSearchParams({ secret, response: token });

  if (origin.ip) {
    body.set("remoteip", origin.ip);
  }

  const reply = await fetch(VERIFY, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(TIMEOUT),
  }).catch(() => null);

  if (!reply?.ok) {
    return false;
  }

  const verdict = (await reply.json().catch(() => null)) as Verdict | null;

  return verdict?.success === true;
};
