import type { ApiClient } from "../client";
import type { ApiResult } from "../types";

export type OnboardingStatus = {
  complete: boolean;
};

export function getOnboarding(
  client: ApiClient,
): Promise<ApiResult<OnboardingStatus>> {
  return client.request("/api/onboarding");
}

export function setOnboarding(
  client: ApiClient,
  complete: boolean,
): Promise<ApiResult<OnboardingStatus>> {
  return client.request("/api/onboarding", {
    method: "PUT",
    body: JSON.stringify({ complete }),
  });
}
