import { useCallback, useEffect, useState } from "react";

// Every accessor is guarded. A private window, cleared site data or a browser
// set to refuse storage throws on read as well as on write.
export const recall = (key: string) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const remember = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // A choice that cannot be stored is not worth failing a render over.
  }
};

/**
 * Starts on the given value so the server and the first paint agree, then takes
 * the stored one. Anything the browser hands back that is not allowed is
 * ignored rather than trusted. `allowed` has to be a stable reference.
 */
export const useRemembered = <T extends string>(key: string, initial: T, allowed: readonly T[]) => {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    const stored = recall(key);

    if (stored && (allowed as readonly string[]).includes(stored)) {
      setValue(stored as T);
    }
  }, [key, allowed]);

  const choose = useCallback(
    (next: T) => {
      setValue(next);
      remember(key, next);
    },
    [key],
  );

  return [value, choose] as const;
};
