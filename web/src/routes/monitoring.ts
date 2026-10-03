import { createSentryTunnelRoute } from "@sentry/tanstackstart-react";
import { createFileRoute } from "@tanstack/react-router";

/**
 * Same-origin Sentry tunnel (`tunnel: "/monitoring"` in instrument.client.ts),
 * so ad blockers do not drop browser events. Accepts envelopes only for the
 * DSN of the server Sentry client. Production: https://opensen.taquangkhoi.com/monitoring
 */
const tunnel = createSentryTunnelRoute({});

export const Route = createFileRoute("/monitoring")({
  server: {
    handlers: {
      ...tunnel.handlers,
      // Only the SDK's POST is meaningful; do not render an empty page on GET.
      GET: () => new Response(null, { status: 405, headers: { Allow: "POST" } }),
    },
  },
});
