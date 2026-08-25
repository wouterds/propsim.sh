import { createCookie } from "react-router";
import { siteUrl } from "./site.server";
import { newToken } from "./token.server";

const AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN = "https://oauth2.googleapis.com/token";
const USERINFO = "https://openidconnect.googleapis.com/v1/userinfo";

const TIMEOUT = 10_000;

const required = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set`);
  }

  return value;
};

export const callbackUrl = () => `${siteUrl()}/auth/google/callback`;

export const googleIsSet = () =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

/** Holds the state and the page to return to, and dies with the round trip. */
export const handoff = createCookie("__oauth", {
  httpOnly: true,
  maxAge: 60 * 10,
  path: "/",
  sameSite: "lax",
  secrets: [process.env.SESSION_SECRET ?? "unset"],
  secure: process.env.NODE_ENV === "production",
});

export const startUrl = (state: string) => {
  const params = new URLSearchParams({
    client_id: required("GOOGLE_CLIENT_ID"),
    redirect_uri: callbackUrl(),
    response_type: "code",
    scope: "openid email",
    state,
    // Google skips the chooser otherwise and signs in whoever it saw last.
    prompt: "select_account",
  });

  return `${AUTH}?${params}`;
};

export const newState = () => newToken();

type TokenReply = { access_token?: string; error_description?: string };

type UserReply = { email?: string; email_verified?: boolean };

export const readGoogleUser = async (code: string) => {
  const reply = await fetch(TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: required("GOOGLE_CLIENT_ID"),
      client_secret: required("GOOGLE_CLIENT_SECRET"),
      redirect_uri: callbackUrl(),
      grant_type: "authorization_code",
    }),
    signal: AbortSignal.timeout(TIMEOUT),
  });

  const token = (await reply.json().catch(() => null)) as TokenReply | null;

  if (!reply.ok || !token?.access_token) {
    throw new Error(`Google refused the code: ${token?.error_description ?? reply.status}`);
  }

  // Read over the wire from Google rather than out of the id token, so there is
  // no signature to check here.
  const who = await fetch(USERINFO, {
    headers: { Authorization: `Bearer ${token.access_token}` },
    signal: AbortSignal.timeout(TIMEOUT),
  });

  const user = (await who.json().catch(() => null)) as UserReply | null;

  if (!who.ok || !user?.email) {
    throw new Error(`Google returned no address: ${who.status}`);
  }

  return { email: user.email.trim().toLowerCase(), verified: user.email_verified === true };
};
