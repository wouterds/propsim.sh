import { claim, readCache, writeCache } from "./cache";

type Held<T> = { value: T; freshUntil: number };

/**
 * Kept far longer than it stays fresh, so a caller that loses the claim always
 * has something to answer with rather than a second request upstream.
 */
const KEPT_SECONDS = 15 * 60;

const inFlight = new Map<string, Promise<unknown>>();

const resolve = async <T>(key: string, freshSeconds: number, load: () => Promise<T>) => {
  const held = await readCache<Held<T>>(key);

  if (held && held.freshUntil > Date.now()) {
    return held.value;
  }

  // Stale but present, and another process is already refreshing it.
  if (held && !(await claim(`${key}:claim`, freshSeconds))) {
    return held.value;
  }

  const value = await load();

  await writeCache(key, { value, freshUntil: Date.now() + freshSeconds * 1000 }, KEPT_SECONDS);

  return value;
};

/**
 * One upstream request per key, however many callers want it. Inside a process
 * they share the in-flight promise. Across processes the claim picks one to
 * refresh and the rest answer from the copy they hold, so load follows the
 * number of products, never the number of users.
 *
 * Not async: the promise has to reach the map before the first await, or
 * callers arriving in the same tick each start their own request.
 */
export const shared = <T>(
  key: string,
  freshSeconds: number,
  load: () => Promise<T>,
): Promise<T> => {
  const running = inFlight.get(key);

  if (running) {
    return running as Promise<T>;
  }

  const work = resolve(key, freshSeconds, load).finally(() => {
    inFlight.delete(key);
  });

  inFlight.set(key, work);

  return work;
};
