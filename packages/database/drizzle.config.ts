import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

import { required } from "./src/env";

// drizzle-kit loads no .env. Resolved against this file so the cwd does not matter.
config({ path: new URL(".env", import.meta.url) });

export default defineConfig({
  dialect: "mysql",
  // The index, not a glob. A glob sweeps the co-located specs in.
  schema: "./src/schema/index.ts",
  out: "./src/__migrations",
  dbCredentials: {
    host: required("DB_HOST"),
    port: 3306,
    user: required("DB_USER"),
    password: required("DB_PASS"),
    database: required("DB_NAME"),
  },
});
