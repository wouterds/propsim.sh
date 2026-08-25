import { resolve } from "node:path";
import { defineConfig } from "rolldown";

export default defineConfig({
  input: ["./src/index.ts"],
  output: {
    dir: "./build",
  },
  // node_modules stays external and is installed in the image, but the
  // workspace packages are bundled in: they ship typescript source and there is
  // nothing at runtime to resolve them.
  external: (id) => /^[^./~]/.test(id) && !id.startsWith("@propsim/"),
  platform: "node",
  resolve: {
    alias: {
      "~": resolve("./src"),
    },
  },
});
