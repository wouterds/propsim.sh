import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import { required } from "./env";
import * as schema from "./schema";

const pool = mysql.createPool({
  host: required("DB_HOST"),
  port: 3306,
  user: required("DB_USER"),
  password: required("DB_PASS"),
  database: required("DB_NAME"),
  connectionLimit: Number.parseInt(process.env.DB_POOL_SIZE || "50", 10),
  maxIdle: 10,
  idleTimeout: 60_000,
  waitForConnections: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

// `decimalNumbers` and a DECIMAL `typeCast` are missing on purpose, and the
// absence is the whole point: either one turns every amount into a JS float
// before drizzle sees it, and drizzle then faithfully stringifies a number whose
// precision is already gone, on a column that still types as `string`.
export const db = drizzle(pool, { schema, mode: "default" });
