import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { captureOperationalError } from "@/lib/observability/operational-error";

import {
  createApiClient,
  createDefaultApiClient,
  isOperationalApiError,
  isRetryable,
  resolveApiBaseUrl,
  withRetry,
} from "./client";
import { ApiError } from "./types";

vi.mock("@/lib/observability/operational-error", () => ({
  captureOperationalError: vi.fn(),
}));

const TOKEN = "header.payload.signature";

describe("createApiClient", () => {
  it("attaches the session bearer token on GET", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.headers).toBeInstanceOf(Headers);
      const headers = init?.headers as Headers;
      expect(headers.get("Authorization")).toBe(`Bearer ${TOKEN}`);
      expect(headers.has("X-User-Id")).toBe(false);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    const client = createApiClient({
      fetch: fetchMock as typeof fetch,
      baseUrl: "http://api.test",
      getAccessToken: async () => TOKEN,
    });

    const result = await client.request<{ ok: boolean }>("/api/practice/due");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.ok).toBe(true);
    }
  });

  it("sends no Authorization header when signed out", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect((init?.headers as Headers).has("Authorization")).toBe(false);
      return new Response(JSON.stringify({ items: [] }), { status: 200 });
    });

    const client = createApiClient({
      fetch: fetchMock as typeof fetch,
      baseUrl: "http://api.test",
      getAccessToken: async () => null,
    });

    const result = await client.request("/api/situations");
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("parses 501 HTTP errors", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          error: "GET /api/situations/x is not implemented yet",
          status: 501,
        }),
        { status: 501 },
      ),
    );

    const client = createApiClient({
      fetch: fetchMock as typeof fetch,
      baseUrl: "http://api.test",
      getAccessToken: async () => TOKEN,
    });

    const result = await client.request("/api/situations/x");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(ApiError);
      expect(result.error.kind).toBe("http");
      expect(result.error.status).toBe(501);
      expect(result.error.message).toContain("not implemented");
    }
  });

  it("parses 400 and 404", async () => {
    for (const status of [400, 404] as const) {
      const fetchMock = vi.fn(async () =>
        new Response(
          JSON.stringify({ error: `Error ${status}`, status }),
          { status },
        ),
      );
      const client = createApiClient({
        fetch: fetchMock as typeof fetch,
        baseUrl: "http://api.test",
        getAccessToken: async () => TOKEN,
      });
      const result = await client.request("/api/chunks/x");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.status).toBe(status);
      }
    }
  });

  it("maps fetch rejection to network error", async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    const client = createApiClient({
      fetch: fetchMock as typeof fetch,
      baseUrl: "http://api.test",
      getAccessToken: async () => TOKEN,
    });
    const result = await client.request("/api/practice/due");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("network");
    }
  });
});

describe("operational error reporting", () => {
  const reportError = vi.fn();

  beforeEach(() => {
    reportError.mockClear();
    vi.mocked(captureOperationalError).mockClear();
  });

  function clientWith(fetchMock: typeof fetch) {
    return createApiClient({
      fetch: fetchMock,
      baseUrl: "http://api.test",
      getAccessToken: async () => TOKEN,
      reportError,
    });
  }

  it("reports network, parse, and HTTP 5xx", async () => {
    await clientWith(async () => {
      throw new TypeError("Failed to fetch");
    }).request("/api/practice/due");
    expect(reportError).toHaveBeenCalledTimes(1);
    expect(reportError.mock.calls[0][0].kind).toBe("network");
    expect(reportError.mock.calls[0][1]).toEqual({ path: "/api/practice/due" });

    reportError.mockClear();
    await clientWith(async () => new Response("not-json", { status: 200 })).request(
      "/api/practice/due",
    );
    expect(reportError).toHaveBeenCalledTimes(1);
    expect(reportError.mock.calls[0][0].kind).toBe("parse");

    reportError.mockClear();
    await clientWith(
      async () =>
        new Response(JSON.stringify({ error: "down", status: 503 }), {
          status: 503,
        }),
    ).request("/api/practice/due");
    expect(reportError).toHaveBeenCalledTimes(1);
    expect(reportError.mock.calls[0][0].status).toBe(503);
  });

  it("does not report HTTP 4xx", async () => {
    await clientWith(
      async () =>
        new Response(JSON.stringify({ error: "missing", status: 404 }), {
          status: 404,
        }),
    ).request("/api/chunks/x");
    expect(reportError).not.toHaveBeenCalled();
    expect(isOperationalApiError(new ApiError("http", "missing", 404))).toBe(
      false,
    );
  });

  it("createDefaultApiClient sends operational failures to Sentry", async () => {
    const client = createDefaultApiClient({
      fetch: async () => {
        throw new TypeError("Failed to fetch");
      },
      baseUrl: "http://api.test",
      getAccessToken: async () => TOKEN,
    });
    const result = await client.request("/api/practice/due");
    expect(result.ok).toBe(false);
    expect(captureOperationalError).toHaveBeenCalledWith(
      expect.any(ApiError),
      expect.objectContaining({
        surface: "api",
        kind: "network",
        path: "/api/practice/due",
      }),
    );
  });

  it("createDefaultApiClient does not send HTTP 4xx to Sentry", async () => {
    const client = createDefaultApiClient({
      fetch: async () =>
        new Response(JSON.stringify({ error: "nope", status: 400 }), {
          status: 400,
        }),
      baseUrl: "http://api.test",
      getAccessToken: async () => TOKEN,
    });
    await client.request("/api/chunks/x");
    expect(captureOperationalError).not.toHaveBeenCalled();
  });
});

describe("resolveApiBaseUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers NEXT_PUBLIC_OPENSEN_API_URL and trims a trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_OPENSEN_API_URL", "http://api.test/");
    vi.stubEnv("NODE_ENV", "production");
    expect(resolveApiBaseUrl()).toBe("http://api.test");
  });

  it("defaults to the public API in production", () => {
    vi.stubEnv("NEXT_PUBLIC_OPENSEN_API_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(resolveApiBaseUrl()).toBe("https://api.opensen.taquangkhoi.com");
  });

  it("defaults to the local Hono server outside production", () => {
    vi.stubEnv("NEXT_PUBLIC_OPENSEN_API_URL", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(resolveApiBaseUrl()).toBe("http://localhost:3000");
  });
});

describe("isRetryable", () => {
  it("is true for network errors", () => {
    expect(isRetryable(new ApiError("network", "offline"))).toBe(true);
  });

  it("is false for 400, 404, and 501", () => {
    for (const status of [400, 404, 501]) {
      expect(isRetryable(new ApiError("http", "x", status))).toBe(false);
    }
  });
});

describe("withRetry", () => {
  it("retries retryable failures", async () => {
    let calls = 0;
    const result = await withRetry(async () => {
      calls += 1;
      if (calls < 2) {
        return { ok: false, error: new ApiError("network", "offline") };
      }
      return { ok: true, data: { done: true } };
    });
    expect(calls).toBe(2);
    expect(result.ok).toBe(true);
  });
});
