// Numbers the browser and the server both have to agree on. Nothing here may
// reach for node, or a page that prints one drags the server into the bundle.
export const CODE_TTL_MINUTES = 10;
export const MAX_ATTEMPTS = 5;
export const CODE_DIGITS = 6;
export const MIN_PASSWORD = 8;

/** A code taken off a query string, reduced to the digits it should have been. */
export const asCode = (value: string | null) =>
  (value ?? "").replace(/\D/g, "").slice(0, CODE_DIGITS);

export const RESET_TTL_MINUTES = 60;
export const EMAIL_CHANGE_TTL_MINUTES = 60;
