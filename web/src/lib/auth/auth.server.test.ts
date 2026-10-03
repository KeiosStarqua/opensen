import { handleAuthProxyRequest } from "@neondatabase/auth/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { proxyAuthRequest } from "./auth.server";

vi.mock("@neondatabase/auth/server", () => ({
  createAuthServer: vi.fn(),
  extractNeonAuthCookies: vi.fn(),
  handleAuthProxyRequest: vi.fn(async () => new Response(null)),
  processAuthMiddleware: vi.fn(),
  resolveNeonAuthLogging: vi.fn(() => undefined),
  validateCookieConfig: vi.fn(),
  DEFAULT_AUTH_SKIP_ROUTES: [],
}));

vi.mock("@tanstack/react-start/server", () => ({
  getRequest: vi.fn(),
  setCookie: vi.fn(),
}));

function proxiedUrl(): URL {
  const config = vi.mocked(handleAuthProxyRequest).mock.calls.at(-1)?.[0];
  return new URL(config!.request.url);
}

describe("proxyAuthRequest", () => {
  beforeEach(() => {
    vi.stubEnv("NEON_AUTH_BASE_URL", "https://auth.example.test/neondb/auth");
    vi.stubEnv("NEON_AUTH_COOKIE_SECRET", "x".repeat(32));
    vi.mocked(handleAuthProxyRequest).mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("skips the session cookie cache so get-session carries the JWT header", async () => {
    await proxyAuthRequest(
      new Request("https://opensen.test/api/auth/get-session"),
      "get-session",
    );
    expect(proxiedUrl().searchParams.get("disableCookieCache")).toBe("true");
  });

  it("forwards other auth calls unchanged", async () => {
    await proxyAuthRequest(
      new Request("https://opensen.test/api/auth/sign-out", { method: "POST" }),
      "sign-out",
    );
    expect(proxiedUrl().searchParams.has("disableCookieCache")).toBe(false);
  });
});
