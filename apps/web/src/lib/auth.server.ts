import type { Session } from "@propsim/database";
import { createCookieSessionStorage, redirect } from "react-router";
import { asPage, safeReturn } from "./redirect.server";
import {
  findSession,
  openSession,
  type RevokeReason,
  revokeSession,
  touchSession,
} from "./sessions.server";

const DAYS = 30;

type SessionData = {
  // The session's secret, not the user's id, so it can be closed from elsewhere.
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

export const startSession = async (request: Request, userId: string, to: string | null) => {
  // Signing in again on a device that is already signed in replaces its row
  // rather than adding one, or the list reads as the same device three times.
  const previous = await getSession(request);

  if (previous?.userId === userId) {
    await revokeSession(previous.userId, previous.id, "logout");
  }

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

/** A new token for the same person, and the old one closed. */
export const rotateSession = async (request: Request, current: Session, reason: RevokeReason) => {
  await revokeSession(current.userId, current.id, reason);

  const session = await sessions().getSession();
  session.set("token", await openSession(request, current.userId));

  return sessions().commitSession(session);
};

// The row is closed as well as the cookie, or a copied token still works.
export const endSession = async (request: Request, to = "/") => {
  const live = await getSession(request);

  if (live) {
    await revokeSession(live.userId, live.id, "logout");
  }

  return redirect(to, {
    headers: { "Set-Cookie": await sessions().destroySession(await read(request)) },
  });
};
