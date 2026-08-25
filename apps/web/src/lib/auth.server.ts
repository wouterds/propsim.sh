import type { Session } from "@propsim/database";
import { createCookieSessionStorage, redirect } from "react-router";
import { asPage, safeReturn } from "./redirect.server";
import { findSession, openSession, revokeSession, touchSession } from "./sessions.server";

const DAYS = 30;

type SessionData = {
  // The session's own secret, not the user's id. Everything about the session
  // lives in the row it names, so it can be closed from another device.
  token: string;
  // Set between signup and the code being confirmed. It opens nothing.
  pendingUserId: string;
};

let storage: ReturnType<typeof createCookieSessionStorage<SessionData>> | undefined;

const sessions = () => {
  if (storage) {
    return storage;
  }

  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }

  storage = createCookieSessionStorage<SessionData>({
    cookie: {
      name: "__session",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * DAYS,
      path: "/",
      sameSite: "lax",
      secrets: [secret],
      secure: process.env.NODE_ENV === "production",
    },
  });

  return storage;
};

const read = (request: Request) => sessions().getSession(request.headers.get("Cookie"));

export const getSession = async (request: Request) => {
  const token = (await read(request)).get("token");

  return token ? findSession(token) : null;
};

export const getUserId = async (request: Request) => (await getSession(request))?.userId ?? null;

export const getPendingUserId = async (request: Request) =>
  (await read(request)).get("pendingUserId") ?? null;

/** The session behind the request, with its last seen time kept current. */
export const requireSession = async (request: Request): Promise<Session> => {
  const session = await getSession(request);

  if (session) {
    await touchSession(session, request);

    return session;
  }

  const back = encodeURIComponent(asPage(new URL(request.url)));

  throw redirect(`/auth?r=${back}`);
};

export const requireUserId = async (request: Request) => (await requireSession(request)).userId;

// A fresh cookie on every sign in, so one handed out before does not carry over.
export const startSession = async (request: Request, userId: string, to: string | null) => {
  const session = await sessions().getSession();
  session.set("token", await openSession(request, userId));

  return redirect(safeReturn(to), {
    headers: { "Set-Cookie": await sessions().commitSession(session) },
  });
};

export const startPending = async (userId: string, to: string | null) => {
  const session = await sessions().getSession();
  session.set("pendingUserId", userId);

  const back = to ? `?r=${encodeURIComponent(safeReturn(to))}` : "";

  return redirect(`/verify${back}`, {
    headers: { "Set-Cookie": await sessions().commitSession(session) },
  });
};

// The row is closed as well as the cookie, or the token would still open the
// account from anywhere it was copied to.
export const endSession = async (request: Request, to = "/") => {
  const live = await getSession(request);

  if (live) {
    await revokeSession(live.userId, live.id, "logout");
  }

  return redirect(to, {
    headers: { "Set-Cookie": await sessions().destroySession(await read(request)) },
  });
};
