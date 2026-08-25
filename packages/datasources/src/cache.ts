import Redis from "ioredis";

// Redis when it is configured, memory when it is not, so a local run needs no
// server and a second container does not fetch what the first already has.
let client: Redis | null | undefined;

const redis = () => {
  if (client !== undefined) {
    return client;
  }

  const url = process.env.REDIS_URL;

  if (!url) {
    client = null;

    return client;
  }

  client = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
  // Without a listener a dropped connection takes the process down.
  client.on("error", (error) => console.error("Redis unavailable", error.message));

  return client;
};

const memory = new Map<string, { value: unknown; until: number }>();

export const readCache = async <T>(key: string): Promise<T | null> => {
  const store = redis();

  if (store) {
    const raw = await store.get(key).catch(() => null);

    return raw ? (JSON.parse(raw) as T) : null;
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
