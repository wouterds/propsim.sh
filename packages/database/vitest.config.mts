import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
    // A table definition is a declaration, not behaviour. Only the uuid codec
    // and the no-float walk pin something a person can break.
    passWithNoTests: true,
    env: { TZ: "UTC" },
  },
});
