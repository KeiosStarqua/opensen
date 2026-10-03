export type ApiErrorKind = "http" | "network" | "parse";

/** Shape of the bearer the client attached. Never store the token itself. */
export type BearerDiagnostics = {
  attached: boolean;
  length?: number;
  shape?: "jwt" | "opaque";
};

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  bearer?: BearerDiagnostics;
  /** Name of the thrown `fetch` error, when `kind` is `network`. */
  causeName?: string;
  /** Message of the thrown `fetch` error, when `kind` is `network`. */
  causeMessage?: string;

  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
  }
}

export type ApiSuccess<T> = { ok: true; data: T };

export type ApiFailure = { ok: false; error: ApiError };

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export type BackendErrorBody = {
  error: string;
  status: number;
};
