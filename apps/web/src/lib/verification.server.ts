import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export const CODE_TTL_MINUTES = 10;
export const MAX_ATTEMPTS = 5;

const DIGITS = 6;

export const generateCode = () => String(randomInt(0, 10 ** DIGITS)).padStart(DIGITS, "0");

// Keyed rather than plain. A six digit code has a million values, so a database
// dump with a bare hash in it is enumerable in seconds.
export const hashCode = (code: string) => {
  const secret = process.env.EMAIL_CODE_SECRET;

  if (!secret) {
    throw new Error("EMAIL_CODE_SECRET is not set");
  }

  return createHmac("sha256", secret).update(code).digest("hex");
};

export const codeMatches = (code: string, hash: string) => {
  const actual = Buffer.from(hashCode(code), "hex");
  const expected = Buffer.from(hash, "hex");

  if (actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(actual, expected);
};

export const expiresAt = (now = new Date()) =>
  new Date(now.getTime() + CODE_TTL_MINUTES * 60 * 1000);
