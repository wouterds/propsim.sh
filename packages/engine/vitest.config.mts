import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
    passWithNoTests: true,
    // Required. The specs assert session dates that are cut on a Chicago clock.
    env: { TZ: "UTC" },
  },
});
