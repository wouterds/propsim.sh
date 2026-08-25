import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

import { required } from "./src/env";

// Resolved against this file rather than the cwd, so the scripts work whether
// they are run from the package or through a workspace filter at the root.
// drizzle-kit loads no .env by itself.
config({ path: new URL(".env", import.meta.url) });

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
