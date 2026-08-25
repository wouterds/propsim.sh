import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.spec.{ts,tsx}"],
    // A workspace with nothing worth testing is not a red run. What earns a
    // test is a judgement here, not a quota.
    passWithNoTests: true,
    env: { TZ: "UTC" },
  },
});
