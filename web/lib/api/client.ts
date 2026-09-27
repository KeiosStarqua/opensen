import { captureOperationalError } from "@/lib/observability/operational-error";

import { getOrCreateLearnerId } from "./learner-id";
import type { ApiResult, BackendErrorBody } from "./types";
import { ApiError } from "./types";

export type ApiErrorReportContext = {
  path: string;
};

export type ApiClientDeps = {
  fetch: typeof fetch;
  baseUrl: string;
  getUserId: () => string;
  /**
   * Called for operational failures only (network, parse, HTTP >= 500).
   * `createDefaultApiClient` reports these to Sentry. HTTP 4xx is not reported.
   */
  reportError?: (error: ApiError, context: ApiErrorReportContext) => void;
};

export function isOperationalApiError(error: ApiError): boolean {
  if (error.kind === "network" || error.kind === "parse") {
    return true;
  }
  return (
    error.kind === "http" &&
    error.status !== undefined &&
    error.status >= 500
  );
}

export function resolveApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_OPENSEN_API_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}

export function createBrowserStorage(): Storage {
  if (typeof window === "undefined") {
    throw new Error("Browser storage is only available in the client");
  }
  return window.localStorage;
}

export function createDefaultApiClient(
  overrides: Partial<ApiClientDeps> = {},
): ApiClient {
  const baseUrl = overrides.baseUrl ?? resolveApiBaseUrl();
  const fetchFn = overrides.fetch ?? fetch;
  const getUserId =
    overrides.getUserId ??
    (() => getOrCreateLearnerId(createBrowserStorage()));

  return createApiClient({
    fetch: fetchFn,
    baseUrl,
    getUserId,
    reportError: (error, context) => {
      captureOperationalError(error, {
        surface: "api",
        kind: error.kind,
        status: error.status,
        path: context.path,
      });
    },
    ...overrides,
  });
}

export type ApiClient = ReturnType<typeof createApiClient>;

export function createApiClient(deps: ApiClientDeps) {
  async function request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<ApiResult<T>> {
    const url = `${deps.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const headers = new Headers(init.headers);
    headers.set("X-User-Id", deps.getUserId());
    if (init.body !== undefined && init.body !== null && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    function fail(error: ApiError): ApiResult<T> {
      if (isOperationalApiError(error)) {
        deps.reportError?.(error, { path });
      }
      return { ok: false, error };
    }

    let response: Response;
    try {
      response = await deps.fetch(url, { ...init, headers });
    } catch {
      return fail(new ApiError("network", "Network request failed"));
    }

    const text = await response.text();
    if (!text) {
      if (response.ok) {
        return { ok: true, data: undefined as T };
      }
      return fail(
        new ApiError(
          "http",
          `Request failed with status ${response.status}`,
          response.status,
        ),
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return fail(
        new ApiError(
          "parse",
          "Response was not valid JSON",
          response.status,
        ),
      );
    }

    if (!response.ok) {
      const body = parsed as Partial<BackendErrorBody>;
      const message =
        typeof body.error === "string"
          ? body.error
          : `Request failed with status ${response.status}`;
      const status =
        typeof body.status === "number" ? body.status : response.status;
      return fail(new ApiError("http", message, status));
    }

    return { ok: true, data: parsed as T };
  }

  return { request, deps };
}

export function isRetryable(error: ApiError): boolean {
  if (error.kind === "network") {
    return true;
  }
  if (
    error.kind === "http" &&
    error.status !== undefined &&
    error.status >= 500 &&
    error.status !== 501
  ) {
    return true;
  }
  return false;
}

export async function withRetry<T>(
  fn: () => Promise<ApiResult<T>>,
  options: { maxAttempts?: number } = {},
): Promise<ApiResult<T>> {
  const maxAttempts = options.maxAttempts ?? 3;
  let last: ApiResult<T> | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    last = await fn();
    if (last.ok) {
      return last;
    }
    if (!isRetryable(last.error) || attempt === maxAttempts) {
      return last;
    }
  }

  return last ?? {
    ok: false,
    error: new ApiError("network", "Retry exhausted"),
  };
}

export function formatApiErrorMessage(error: ApiError): string {
  if (error.kind === "network") {
    return "Could not reach the server. Check your connection and try again.";
  }
  if (error.status === 501) {
    return error.message || "This feature is not available yet.";
  }
  return error.message || "Something went wrong.";
}
