import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import { required } from "./env";
import * as schema from "./schema";

let instance: MySql2Database<typeof schema> | undefined;

// Built on first use, not on import. Reading the credentials at module load
// stops the whole server booting when it only needs them for some routes.
export const getDb = () => {
  if (instance) {
    return instance;
  }

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

  // Never add `decimalNumbers` or a DECIMAL `typeCast`. Either one makes every
  // amount a JS float before drizzle sees it, on a column that still types as string.
  instance = drizzle(pool, { schema, mode: "default" });

  return instance;
};
