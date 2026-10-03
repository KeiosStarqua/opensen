"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { practiceApi } from "@/lib/api";
import type { ReviewRating } from "@/lib/practice/types";

import { unwrapApiResult } from "../api-query";
import { useApiClient } from "../query-provider";
import { queryKeys } from "../query-keys";

export type PracticePlanStats = {
  total: number;
  dueNow: number;
  dueNext7Days: number;
  reviewedToday: number;
  byStatus?: Record<string, number>;
};

export function usePracticePlan() {
  const client = useApiClient();
  return useQuery({
    queryKey: queryKeys.practice.plan(),
    queryFn: async () =>
      (await unwrapApiResult(
        practiceApi.getPracticePlan(client),
      )) as PracticePlanStats,
  });
}

export function usePracticeDue(limit: number) {
  const client = useApiClient();
  return useQuery({
    queryKey: queryKeys.practice.due({ limit }),
    queryFn: () => unwrapApiResult(practiceApi.getPracticeDue(client, { limit })),
    select: (data) => data.items ?? [],
  });
}

/**
 * Due items frozen for one recall session: fetched fresh on mount, never
 * refetched in the background, and dropped from cache on unmount.
 */
export function usePracticeSessionDeck(
  limit: number,
  options: { enabled: boolean },
) {
  const client = useApiClient();
  return useQuery({
    queryKey: queryKeys.practiceSessionDeck(limit),
    queryFn: () => unwrapApiResult(practiceApi.getPracticeDue(client, { limit })),
    select: (data) => data.items ?? [],
    enabled: options.enabled,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

/** Grade one chunk; refreshes every plan and due list on success. */
export function useSubmitReview() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { chunkId: string; rating: ReviewRating }) =>
      unwrapApiResult(practiceApi.postPracticeReview(client, input)),
    onSuccess: () => {
      // Not awaited: the session advances without waiting on refetches.
      void queryClient.invalidateQueries({ queryKey: queryKeys.practice.all });
    },
  });
}
