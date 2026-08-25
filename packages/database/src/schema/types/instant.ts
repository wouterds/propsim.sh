import { datetime } from "drizzle-orm/mysql-core";

/**
 * DATETIME, never TIMESTAMP. A nullable TIMESTAMP is emitted with no NULL
 * keyword, and MariaDB reads that as NOT NULL with a zero default, which turns
 * the `closedAt IS NULL` and `lockedAt IS NULL` tests this schema is built on
 * into constants. TIMESTAMP also shifts with the server time zone and stops at
 * 2038, neither of which a replay of stored tape can afford.
 */
export const instant = <T extends string>(name: T) => datetime(name, { fsp: 3 });
