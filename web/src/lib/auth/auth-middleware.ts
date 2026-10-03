import { createMiddleware } from "@tanstack/react-start";

import { checkProtectedRequest } from "./auth.server";
import { isProtectedPath, signInUrlFor } from "./protected-routes";

const PRIVATE_CACHE = "private, no-store";

/**
 * Global request middleware (see `src/start.ts`). Replaces the Next.js
 * `proxy.ts`: every document request under a protected prefix gets a
 * server-side session check. Signed-out learners get a 307 to sign-in with
 * `redirectTo`; signed-in responses carry refreshed session cookies and are
 * never shared-cacheable. Server function calls are skipped here; each one
 * authorizes itself.
 */
export const authRequestMiddleware = createMiddleware({ type: "request" }).server(
  async ({ request, pathname, handlerType, next }) => {
    if (handlerType === "serverFn" || !isProtectedPath(pathname)) {
      return next();
    }

    const { search } = new URL(request.url);
    const result = await checkProtectedRequest(
      request,
      pathname,
      signInUrlFor(pathname, search),
    );

    if (result.action !== "allow") {
      const headers = new Headers({
        Location: result.redirectUrl.toString(),
        "Cache-Control": PRIVATE_CACHE,
      });
      for (const cookie of result.cookies ?? []) {
        headers.append("Set-Cookie", cookie);
      }
      return new Response(null, { status: 307, headers });
    }

    const { response } = await next();
    const headers = new Headers(response.headers);
    for (const cookie of result.cookies ?? []) {
      headers.append("Set-Cookie", cookie);
    }
    headers.set("Cache-Control", PRIVATE_CACHE);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
);
