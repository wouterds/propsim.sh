import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
    // A workspace with nothing worth testing is not a red run. What earns a
    // test is a judgement here, not a quota.
    passWithNoTests: true,
    // Load-bearing rather than conventional: every stamp asserted here is a
    // millisecond epoch built off second arithmetic, so a machine on CET has to
    // produce the same numbers CI does.
    env: { TZ: "UTC" },
  },
});
