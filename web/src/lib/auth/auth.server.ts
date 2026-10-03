import {
  createAuthServer,
  extractNeonAuthCookies,
  handleAuthProxyRequest,
  processAuthMiddleware,
  resolveNeonAuthLogging,
  validateCookieConfig,
  DEFAULT_AUTH_SKIP_ROUTES,
  type MiddlewareResult,
  type NeonAuthServer,
  type RequestContext,
} from "@neondatabase/auth/server";
import { getRequest, setCookie } from "@tanstack/react-start/server";

/**
 * Neon Auth adapter for TanStack Start, built on the framework-agnostic
 * `@neondatabase/auth/server` toolkit (the bundled adapter targets Next.js).
 * Server-only: import from server functions, server routes, and request
 * middleware, never from components.
 */

type ProxyConfig = {
  baseUrl: string;
  cookieSecret: string;
  log: ReturnType<typeof resolveNeonAuthLogging>;
};

let cachedConfig: ProxyConfig | undefined;
let cachedServer: NeonAuthServer | undefined;

/** Env is read on first use, per server instance, not at module scope. */
function proxyConfig(): ProxyConfig {
  if (cachedConfig) return cachedConfig;
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl || !secret) {
    throw new Error(
      "NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET must be set for Neon Auth",
    );
  }
  validateCookieConfig({ secret });
  cachedConfig = { baseUrl, cookieSecret: secret, log: resolveNeonAuthLogging({}) };
  return cachedConfig;
}

function requestOrigin(request: Request): string {
  const origin = request.headers.get("origin");
  if (origin) return origin;
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      // fall through to the request URL
    }
  }
  return new URL(request.url).origin;
}

/** Bridges the in-flight Start request (AsyncLocalStorage) to the toolkit. */
function startRequestContext(): RequestContext {
  const request = getRequest();
  return {
    getCookies: () => extractNeonAuthCookies(request.headers),
    setCookie: (name, value, options) => setCookie(name, value, options),
    getHeader: (name) => request.headers.get(name),
    getOrigin: () => requestOrigin(request),
    getFramework: () => "tanstack-start",
  };
}

/** Better Auth server methods (`getSession`, `signIn.email`, `signOut`, ...). */
export function getAuth(): NeonAuthServer {
  if (cachedServer) return cachedServer;
  const config = proxyConfig();
  cachedServer = createAuthServer({
    baseUrl: config.baseUrl,
    context: startRequestContext,
    cookieSecret: config.cookieSecret,
    log: config.log,
  });
  return cachedServer;
}

/** Proxies a browser `/api/auth/<path>` call to Neon Auth. */
export function proxyAuthRequest(request: Request, path: string): Promise<Response> {
  const config = proxyConfig();
  return handleAuthProxyRequest({
    request,
    path,
    baseUrl: config.baseUrl,
    cookieSecret: config.cookieSecret,
    log: config.log,
  });
}

/** Session check + refresh + OAuth callback for one protected page request. */
export function checkProtectedRequest(
  request: Request,
  pathname: string,
  loginUrl: string,
): Promise<MiddlewareResult> {
  const config = proxyConfig();
  return processAuthMiddleware({
    request,
    pathname,
    skipRoutes: DEFAULT_AUTH_SKIP_ROUTES,
    loginUrl,
    baseUrl: config.baseUrl,
    cookieSecret: config.cookieSecret,
    log: config.log,
  });
}
