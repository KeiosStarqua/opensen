import { createFileRoute } from "@tanstack/react-router";

import { proxyAuthRequest } from "@/lib/auth/auth.server";

/** Browser auth client calls (`/api/auth/get-session`, ...) proxied to Neon Auth. */
function handle({ request, params }: { request: Request; params: { _splat?: string } }) {
  return proxyAuthRequest(request, params._splat ?? "");
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
      PUT: handle,
      DELETE: handle,
      PATCH: handle,
    },
  },
});
