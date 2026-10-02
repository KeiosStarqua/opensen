export type ApiErrorKind = "http" | "network" | "parse";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;

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
