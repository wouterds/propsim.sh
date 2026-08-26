// Both sides read these. Nothing here may reach for node, or a page that prints
// one drags the server into the client bundle.
export const CODE_TTL_MINUTES = 10;
export const MAX_ATTEMPTS = 5;
export const CODE_DIGITS = 6;
export const MIN_PASSWORD = 8;

export const asCode = (value: string | null) =>
  (value ?? "").replace(/\D/g, "").slice(0, CODE_DIGITS);

export const MIN_USERNAME = 3;
export const MAX_USERNAME = 20;

// Letters of any script, so a name is not an English-only privilege. Marks are
// in for accents, and the first character must be a letter or a number.
const USERNAME = /^[\p{L}\p{N}][\p{L}\p{M}\p{N} _-]*$/u;

/** Null when the name is allowed, otherwise what to tell the person. */
export const usernameError = (value: string) => {
  if (value.length < MIN_USERNAME) {
    return `Use at least ${MIN_USERNAME} characters.`;
  }

  if (value.length > MAX_USERNAME) {
    return `Use at most ${MAX_USERNAME} characters.`;
  }

  if (!USERNAME.test(value)) {
    return "Letters, numbers, spaces, hyphens and underscores, starting with a letter or a number.";
  }

  return null;
};

export const RESET_TTL_MINUTES = 60;
export const EMAIL_CHANGE_TTL_MINUTES = 60;
