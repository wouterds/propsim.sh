import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
    // A workspace with nothing worth testing is not a red run.
    passWithNoTests: true,
    // Required. The specs assert millisecond stamps built from second arithmetic.
    env: { TZ: "UTC" },
  },
});
