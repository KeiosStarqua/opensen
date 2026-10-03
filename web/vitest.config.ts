import path from "node:path";
import { defineConfig } from "vitest/config";

// Separate from vite.config.ts so unit tests do not load the Start, Nitro,
// and Sentry build plugins.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
});
