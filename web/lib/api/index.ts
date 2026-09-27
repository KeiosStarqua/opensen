export {
  createApiClient,
  createDefaultApiClient,
  formatApiErrorMessage,
  isOperationalApiError,
  isRetryable,
  resolveApiBaseUrl,
  withRetry,
  type ApiClient,
  type ApiClientDeps,
  type ApiErrorReportContext,
} from "./client";
export { getOrCreateLearnerId, isValidLearnerId } from "./learner-id";
export { ApiError, LEARNER_ID_STORAGE_KEY, type ApiResult } from "./types";
export * as situationsApi from "./routes/situations";
export * as chunksApi from "./routes/chunks";
export * as dialoguesApi from "./routes/dialogues";
export * as practiceApi from "./routes/practice";
export * as exportApi from "./routes/export";
