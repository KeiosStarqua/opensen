import { sentryTanstackStart } from "@sentry/tanstackstart-react/vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Vite does not load .env files into process.env for the config itself.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: { port: 3001 },
    resolve: { tsconfigPaths: true },
    plugins: [
      tailwindcss(),
      tanstackStart(),
      // Vercel preset is picked automatically on Vercel builds; Node server elsewhere.
      nitro(),
      // React's plugin must come after Start's plugin.
      viteReact(),
      // Sentry must be last (source maps + middleware tracing). The tunnel is
      // our own route (src/routes/monitoring.ts): the plugin's managed tunnel
      // pulls the whole browser SDK, Replay included, into the main chunk.
      sentryTanstackStart({
        org: env.SENTRY_ORG,
        project: env.SENTRY_PROJECT,
        authToken: env.SENTRY_AUTH_TOKEN,
        silent: !env.CI,
      }),
    ],
  };
});
