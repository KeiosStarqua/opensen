import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { onboardingApi } from "@/lib/api";
import type { OnboardingStatus } from "@/lib/api/routes/onboarding";
import { authClient } from "@/lib/auth/client";
import { signedInUserId } from "@/lib/auth/signed-in-user";

import { unwrapApiResult } from "../api-query";
import { useApiClient } from "../query-provider";
import { queryKeys } from "../query-keys";

export type { OnboardingStatus };

/**
 * Account-level onboarding flag. Disabled until a session exists so the
 * public landing page does not send an anonymous request. `staleTime: 0`
 * so a landing tab that stays open refetches after sign-in or finishing
 * onboarding instead of keeping the previous destination.
 */
export function useOnboardingStatus() {
  const client = useApiClient();
  const { data: session, isPending } = authClient.useSession();
  const userId = isPending ? null : signedInUserId(session);
  return useQuery({
    queryKey: queryKeys.onboarding.status(userId),
    queryFn: async () => unwrapApiResult(onboardingApi.getOnboarding(client)),
    enabled: userId != null,
    staleTime: 0,
  });
}

export function useSetOnboardingComplete() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const userId = signedInUserId(session);
  return useMutation({
    mutationFn: async (complete: boolean) =>
      unwrapApiResult(onboardingApi.setOnboarding(client, complete)),
    onSuccess: (status) => {
      queryClient.setQueryData(queryKeys.onboarding.status(userId), status);
    },
  });
}
