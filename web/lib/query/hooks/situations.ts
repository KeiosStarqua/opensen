"use client";

import { useQuery } from "@tanstack/react-query";

import { situationsApi } from "@/lib/api";

import { unwrapApiResult } from "../api-query";
import { useApiClient } from "../query-provider";
import { queryKeys } from "../query-keys";

export type SituationSummary = situationsApi.SituationListResponse["items"][number];

export type SituationDetail = SituationSummary & {
  intents: Array<{ id: string; name: string; description: string }>;
  dialogues: Array<{ id: string; title: string; level: string }>;
  chunks: Array<{ id: string; text: string; meaning: string }>;
};

export function useSituationsList(query: { limit?: number } = {}) {
  const client = useApiClient();
  return useQuery({
    queryKey: queryKeys.situations.list(query),
    queryFn: () => unwrapApiResult(situationsApi.listSituations(client, query)),
    select: (data) => data.items ?? [],
  });
}

export function useSituation(id: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: queryKeys.situations.detail(id),
    queryFn: async () =>
      (await unwrapApiResult(
        situationsApi.getSituation(client, id),
      )) as SituationDetail,
  });
}
