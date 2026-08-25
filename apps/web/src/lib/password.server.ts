import { randomBytes, type ScryptOptions, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const derive = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
) => Promise<Buffer>;

const COST = 16_384;
const KEY_BYTES = 64;
const SALT_BYTES = 16;

// The cost is stored beside the hash so it can be raised without invalidating
// every password already in the table.
export const hashPassword = async (password: string) => {
  const salt = randomBytes(SALT_BYTES);
  const key = await derive(password, salt, KEY_BYTES, { N: COST });

  return `scrypt$${COST}$${salt.toString("hex")}$${key.toString("hex")}`;
};

export const verifyPassword = async (password: string, stored: string) => {
  const [scheme, cost, salt, key] = stored.split("$");

  if (scheme !== "scrypt" || !cost || !salt || !key) {
    return false;
  }

  const expected = Buffer.from(key, "hex");
  const actual = await derive(password, Buffer.from(salt, "hex"), expected.length, {
    N: Number(cost),
  });

  return timingSafeEqual(actual, expected);
};
