import { randomBytes } from "node:crypto";
import { customType } from "drizzle-orm/mysql-core";

const HEX_32 = /^[0-9a-f]{32}$/i;

/**
 * RFC 9562 UUIDv7. Time-ordered, because a random BINARY(16) key splits an InnoDB
 * page on nearly every insert. It orders only to the millisecond.
 */
export const UUIDv7 = (): string => {
  const bytes = randomBytes(16);
  const timestamp = BigInt(Date.now());

  bytes[0] = Number((timestamp >> 40n) & 0xffn);
  bytes[1] = Number((timestamp >> 32n) & 0xffn);
  bytes[2] = Number((timestamp >> 24n) & 0xffn);
  bytes[3] = Number((timestamp >> 16n) & 0xffn);
  bytes[4] = Number((timestamp >> 8n) & 0xffn);
  bytes[5] = Number(timestamp & 0xffn);
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.toString("hex");

  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20),
  ].join("-");
};

export const uuid = customType<{ data: string; driverData: Buffer }>({
  dataType() {
    return "BINARY(16)";
  },

  // Bound, never interpolated. Ids arrive from URLs.
  toDriver(value) {
    const hex = value.replace(/-/g, "");

    if (!HEX_32.test(hex)) {
      throw new Error("invalid uuid");
    }

    return Buffer.from(hex, "hex");
  },

  fromDriver(value: Buffer) {
    const hex = value.toString("hex");

    return [
      hex.substring(0, 8),
      hex.substring(8, 12),
      hex.substring(12, 16),
      hex.substring(16, 20),
      hex.substring(20),
    ].join("-");
  },
});
