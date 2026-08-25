export const CODE_TTL_MINUTES = 10;
export const MAX_ATTEMPTS = 5;
export const CODE_DIGITS = 6;

/** A code taken off a query string, reduced to the digits it should have been. */
export const asCode = (value: string | null) =>
  (value ?? "").replace(/\D/g, "").slice(0, CODE_DIGITS);
