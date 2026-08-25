import { createCookieSessionStorage, redirect } from "react-router";
import { asPage, safeReturn } from "./redirect.server";

const WEEK = 60 * 60 * 24 * 7;

type SessionData = {
  userId: string;
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
      maxAge: WEEK,
      path: "/",
      sameSite: "lax",
      secrets: [secret],
      secure: process.env.NODE_ENV === "production",
    },
  });

  return storage;
};

const read = (request: Request) => sessions().getSession(request.headers.get("Cookie"));

export const getUserId = async (request: Request) => (await read(request)).get("userId") ?? null;

export const getPendingUserId = async (request: Request) =>
  (await read(request)).get("pendingUserId") ?? null;

export const requireUserId = async (request: Request) => {
  const userId = await getUserId(request);

  if (userId) {
    return userId;
  }

  const back = encodeURIComponent(asPage(new URL(request.url)));

  throw redirect(`/auth?r=${back}`);
};

// A fresh session on every sign in, so a cookie handed out before does not
// carry over.
export const startSession = async (userId: string, to: string | null) => {
  const session = await sessions().getSession();
  session.set("userId", userId);

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

export const endSession = async (request: Request) => {
  const session = await read(request);

  return redirect("/", {
    headers: { "Set-Cookie": await sessions().destroySession(session) },
  });
};
