import { captureOperationalError } from "@/lib/observability/operational-error";

import { apiErrorSentryFields, describeBearer } from "./error-report";
import { getSessionToken } from "./session-token";
import type { ApiResult, BackendErrorBody } from "./types";
import { ApiError } from "./types";

export type ApiErrorReportContext = {
  path: string;
};

export type ApiClientDeps = {
  fetch: typeof fetch;
  baseUrl: string;
  /** Bearer token for the signed-in learner; null sends the request anonymously. */
  getAccessToken: () => Promise<string | null>;
  /**
   * Called once for every failed request. `createDefaultApiClient` sends it to
   * Sentry: network, parse, and HTTP >= 500 as `error`, HTTP 4xx as `warning`.
   */
  reportError?: (error: ApiError, context: ApiErrorReportContext) => void;
};

/** Network, parse, and HTTP >= 500: the request was fine, the system was not. */
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

export const PRODUCTION_API_URL = "https://api.opensen.taquangkhoi.com";
export const LOCAL_API_URL = "http://localhost:3000";

/**
 * `NEXT_PUBLIC_OPENSEN_API_URL` wins when set. Otherwise production builds use
 * the public API and local development uses the Hono dev server.
 */
export function resolveApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_OPENSEN_API_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  return process.env.NODE_ENV === "production"
    ? PRODUCTION_API_URL
    : LOCAL_API_URL;
}

export function createDefaultApiClient(
  overrides: Partial<ApiClientDeps> = {},
): ApiClient {
  const baseUrl = overrides.baseUrl ?? resolveApiBaseUrl();
  const fetchFn = overrides.fetch ?? fetch;
  const getAccessToken = overrides.getAccessToken ?? getSessionToken;

  return createApiClient({
    fetch: fetchFn,
    baseUrl,
    getAccessToken,
    reportError: (error, context) => reportApiError(error, context.path, baseUrl),
    ...overrides,
  });
}

/**
 * Sentry report for a failed API call, shared by the JSON client and the Anki
 * file download. Never attaches the bearer value, only its shape and length.
 */
export function reportApiError(
  error: ApiError,
  path: string,
  baseUrl: string = resolveApiBaseUrl(),
): void {
  const fields = apiErrorSentryFields(error);
  captureOperationalError(
    error,
    {
      surface: "api",
      path,
      apiHost: apiHost(baseUrl),
      ...fields.tags,
    },
    {
      ...fields.extra,
      uiMessage: formatApiErrorMessage(error),
    },
    isOperationalApiError(error) ? "error" : "warning",
  );
}

export type ApiClient = ReturnType<typeof createApiClient>;

export function createApiClient(deps: ApiClientDeps) {
  async function request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<ApiResult<T>> {
    const url = `${deps.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const headers = new Headers(init.headers);
    const token = await deps.getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    if (init.body !== undefined && init.body !== null && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    function fail(error: ApiError): ApiResult<T> {
      error.bearer = describeBearer(token);
      deps.reportError?.(error, { path });
      return { ok: false, error };
    }

    let response: Response;
    try {
      response = await deps.fetch(url, { ...init, headers });
    } catch (caught) {
      const error = new ApiError(
        "network",
        caught instanceof Error && caught.message
          ? caught.message
          : "Network request failed",
      );
      if (caught instanceof Error) {
        error.causeName = caught.name;
        error.causeMessage = caught.message;
      } else if (typeof caught === "string" && caught) {
        error.causeMessage = caught;
      }
      return fail(error);
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

function apiHost(baseUrl: string): string | undefined {
  try {
    return new URL(baseUrl).host;
  } catch {
    return undefined;
  }
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
