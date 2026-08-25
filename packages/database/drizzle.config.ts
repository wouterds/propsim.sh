import { defineConfig } from "drizzle-kit";

import { required } from "./src/env";

export default defineConfig({
  dialect: "mysql",
  // The index rather than a glob: `./src/schema/**.ts` degrades to a single
  // segment match, sweeping co-located specs into a bundle drizzle-kit executes.
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
