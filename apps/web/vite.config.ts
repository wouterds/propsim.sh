import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  // Tailwind has to see the source before react router rewrites the route
  // modules, so the order here is load-bearing rather than alphabetical.
  plugins: [tailwindcss(), reactRouter()],
});
