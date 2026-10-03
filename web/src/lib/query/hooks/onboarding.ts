import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { onboardingApi } from "@/lib/api";
import type { OnboardingStatus } from "@/lib/api/routes/onboarding";
import { authClient } from "@/lib/auth/client";

import { unwrapApiResult } from "../api-query";
import { useApiClient } from "../query-provider";
import { queryKeys } from "../query-keys";

export type { OnboardingStatus };

/**
 * Account-level onboarding flag. Disabled until a session exists so the
 * public landing page does not send an anonymous request.
 */
export function useOnboardingStatus() {
  const client = useApiClient();
  const { data: session, isPending } = authClient.useSession();
  return useQuery({
    queryKey: queryKeys.onboarding.status(),
    queryFn: async () => unwrapApiResult(onboardingApi.getOnboarding(client)),
    enabled: !isPending && session != null,
  });
}

export function useSetOnboardingComplete() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (complete: boolean) =>
      unwrapApiResult(onboardingApi.setOnboarding(client, complete)),
    onSuccess: (status) => {
      queryClient.setQueryData(queryKeys.onboarding.status(), status);
    },
  });
}
