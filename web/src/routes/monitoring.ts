import { createSentryTunnelRoute } from "@sentry/tanstackstart-react";
import { createFileRoute } from "@tanstack/react-router";

/**
 * Same-origin Sentry tunnel (`tunnel: "/monitoring"` in instrument.client.ts),
 * so ad blockers do not drop browser events. Accepts envelopes only for the
 * DSN of the server Sentry client. Production: https://opensen.taquangkhoi.com/monitoring
 */
export const Route = createFileRoute("/monitoring")({
  server: createSentryTunnelRoute({}),
});
