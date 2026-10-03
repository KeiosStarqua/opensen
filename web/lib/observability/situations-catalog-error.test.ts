import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDefaultApiClient } from "@/lib/api/client";

import { captureOperationalError } from "@/lib/observability/operational-error";
import { reportSituationsCatalogError } from "@/lib/observability/situations-catalog-error";

vi.mock("@/lib/observability/operational-error", () => ({
  captureOperationalError: vi.fn(),
}));

const SESSION_TOKEN = "a".repeat(32);

describe("reportSituationsCatalogError", () => {
  beforeEach(() => {
    vi.mocked(captureOperationalError).mockClear();
  });

  it("sends HTTP 401 with bearer shape and the API message", async () => {
    const client = createDefaultApiClient({
      fetch: async () =>
        new Response(
          JSON.stringify({ error: "Invalid or expired token", status: 401 }),
          { status: 401 },
        ),
      baseUrl: "https://api.opensen.taquangkhoi.com",
      getAccessToken: async () => SESSION_TOKEN,
    });

    const result = await client.request("/api/situations?limit=50");
    expect(result.ok).toBe(false);
    if (result.ok) return;

    reportSituationsCatalogError(result.error);

    expect(captureOperationalError).toHaveBeenCalledTimes(1);
    expect(captureOperationalError).toHaveBeenCalledWith(
      result.error,
      expect.objectContaining({
        surface: "situations-catalog",
        path: "/api/situations",
        kind: "http",
        status: 401,
        bearerAttached: "true",
        bearerShape: "opaque",
        bearerLength: 32,
      }),
      expect.objectContaining({
        uiMessage: "Invalid or expired token",
      }),
    );
    expect(result.error.message).toBe("Invalid or expired token");
  });

  it("leaves network failures to the API client", async () => {
    const client = createDefaultApiClient({
      fetch: async () => {
        throw new TypeError("Failed to fetch");
      },
      baseUrl: "https://api.opensen.taquangkhoi.com",
      getAccessToken: async () => SESSION_TOKEN,
    });

    const result = await client.request("/api/situations?limit=50");
    expect(result.ok).toBe(false);
    if (result.ok) return;

    const callsAfterClient = vi.mocked(captureOperationalError).mock.calls.length;
    reportSituationsCatalogError(result.error);
    expect(vi.mocked(captureOperationalError).mock.calls.length).toBe(
      callsAfterClient,
    );
  });
});
