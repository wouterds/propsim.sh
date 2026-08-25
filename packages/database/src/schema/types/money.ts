import { decimal } from "drizzle-orm/mysql-core";

/**
 * Every amount in this package is DECIMAL carried as a string, never a float and
 * never a JS number. The mode is spelled once, here, because
 * `decimal(name, { precision, scale, mode: "number" })` maps through
 * `Number(value)` and is one keystroke from the correct form, invisible in a
 * review and silent at runtime. With the shapes behind these three helpers there
 * is no call site left to slip it into.
 */
export const money = <T extends string>(name: T) => decimal(name, { precision: 20, scale: 4 });

/** Quotes, not amounts: a price times a point value is what becomes money. */
export const price = <T extends string>(name: T) => decimal(name, { precision: 18, scale: 8 });

export const multiplier = <T extends string>(name: T) => decimal(name, { precision: 12, scale: 4 });
