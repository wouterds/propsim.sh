import Redis from "ioredis";

// Redis runs beside the app in compose, so there is nothing to configure. Every
// path below falls back to memory when it is not there, which is what a local
// run and a restarting container both look like.
const URL = process.env.NODE_ENV === "production" ? "redis://redis:6379" : "redis://127.0.0.1:6379";

let complained = false;

// A spec resets the modules that hold a cache, which resets the memory below and
// cannot reset a server. Reaching a Redis that happens to be running on the same
// machine makes a test answer from a previous run, so the tests keep to memory.
const SHARED = process.env.NODE_ENV !== "test";

// Opened at boot rather than on the first read, or the first request would
// always find the connection still coming up and answer from memory.
const client = SHARED
  ? new Redis(URL, {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      retryStrategy: (attempt) => Math.min(attempt * 500, 30_000),
    })
  : null;

// Without a listener a dropped connection takes the process down, and a server
// that is simply not there would print on every retry.
client?.on("error", (error) => {
  if (complained) {
    return;
  }

  complained = true;
  console.error("Redis unavailable, caching in memory", error.message);
});

client?.on("ready", () => {
  complained = false;
});

const redis = () => (client?.status === "ready" ? client : null);

const memory = new Map<string, { value: unknown; until: number }>();

export const readCache = async <T>(key: string): Promise<T | null> => {
  const raw = await redis()
    ?.get(key)
    .catch(() => null);

  if (raw) {
    return JSON.parse(raw) as T;
  }

  const held = memory.get(key);

  if (!held || held.until <= Date.now()) {
    return null;
  }

  return held.value as T;
};

export const writeCache = async (key: string, value: unknown, seconds: number) => {
  const store = redis();

  if (store) {
    await store.set(key, JSON.stringify(value), "EX", seconds).catch(() => undefined);

    return;
  }

  memory.set(key, { value, until: Date.now() + seconds * 1000 });
};

/**
 * Adds one and answers with the total, starting the clock on the first. Redis
 * counts across containers, memory only inside this process, so a count is a
 * floor on what really happened rather than an exact tally.
 */
export const countUp = async (key: string, seconds: number) => {
  const store = redis();

  if (store) {
    const total = await store.incr(key).catch(() => null);

    if (total === null) {
      return 0;
    }

    if (total === 1) {
      await store.expire(key, seconds).catch(() => undefined);
    }

    return total;
  }

  const held = memory.get(key);
  const running = held && held.until > Date.now() ? Number(held.value) : 0;
  const total = running + 1;

  memory.set(key, { value: total, until: held?.until ?? Date.now() + seconds * 1000 });

  return total;
};

/** The count so far, without adding to it. Zero when nothing is being kept. */
export const readCount = async (key: string) => {
  const store = redis();

  if (store) {
    const raw = await store.get(key).catch(() => null);

    return raw === null ? 0 : Number(raw);
  }

  const held = memory.get(key);

  return held && held.until > Date.now() ? Number(held.value) : 0;
};

export const clearCount = async (key: string) => {
  const store = redis();

  if (store) {
    await store.del(key).catch(() => undefined);

    return;
  }

  memory.delete(key);
};

/**
 * True for the one caller that took it, false for everyone else until it runs
 * out. Redis makes it hold across containers, memory only inside this process.
 */
export const claim = async (key: string, seconds: number) => {
  const store = redis();

  if (store) {
    const won = await store.set(key, "1", "EX", seconds, "NX").catch(() => null);

    return won === "OK";
  }

  const held = memory.get(key);

  if (held && held.until > Date.now()) {
    return false;
  }

  memory.set(key, { value: "1", until: Date.now() + seconds * 1000 });

  return true;
};
