import type { ApiError, BearerDiagnostics } from "./types";

/**
 * JWT is three non-empty dot-separated segments (Neon Auth, EdDSA).
 * A Better Auth session token is a short opaque string.
 */
export function describeBearer(token: string | null): BearerDiagnostics {
  if (!token) {
    return { attached: false };
  }
  const parts = token.split(".");
  const shape =
    parts.length === 3 && parts.every((part) => part.length > 0)
      ? "jwt"
      : "opaque";
  return { attached: true, length: token.length, shape };
}

export function apiErrorSentryFields(error: ApiError): {
  tags: Record<string, string | number | undefined>;
  extra: Record<string, string | undefined>;
} {
  return {
    tags: {
      kind: error.kind,
      status: error.status,
      bearerAttached: error.bearer ? String(error.bearer.attached) : undefined,
      bearerShape: error.bearer?.shape,
      bearerLength: error.bearer?.length,
    },
    extra: {
      causeName: error.causeName,
      causeMessage: error.causeMessage,
    },
  };
}
