import {
  captureOperationalError,
  type OperationalLevel,
} from "@/lib/observability/operational-error";

export type AuthAction = "sign-in" | "sign-up" | "update-name";

type AuthSdkError = { message?: string; status?: number; code?: string };

/**
 * Sentry report for a message an auth form shows. SDK failures with a status
 * below 500 (wrong password, taken email) and empty fields are `warning`;
 * everything else from the SDK is `error`.
 */
export function reportAuthFormError(
  action: AuthAction,
  message: string,
  detail: { sdkError?: AuthSdkError; reason?: "empty-field" } = {},
): void {
  const status = detail.sdkError?.status;
  const level: OperationalLevel =
    detail.reason === "empty-field" ||
    (status !== undefined && status >= 400 && status < 500)
      ? "warning"
      : "error";
  captureOperationalError(
    new Error(message),
    {
      surface: "auth",
      action,
      reason: detail.reason,
      status,
      code: detail.sdkError?.code,
    },
    {},
    level,
  );
}
