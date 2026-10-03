import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { savedSentencesApi } from "@/lib/api";
import type { SavedSentence } from "@/lib/api/routes/saved-sentences";

import { unwrapApiResult } from "../api-query";
import { useApiClient } from "../query-provider";
import { queryKeys } from "../query-keys";

export type { SavedSentence };

export function useSavedSentences() {
  const client = useApiClient();
  return useQuery({
    queryKey: queryKeys.savedSentences.list(),
    queryFn: async () =>
      unwrapApiResult(savedSentencesApi.listSavedSentences(client)),
    select: (data) => data.items,
  });
}

export function useSavedSentence(id: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: queryKeys.savedSentences.detail(id),
    queryFn: async () =>
      unwrapApiResult(savedSentencesApi.getSavedSentence(client, id)),
  });
}

export function useSaveSentence() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) =>
      unwrapApiResult(savedSentencesApi.createSavedSentence(client, text)),
    onSuccess: (sentence) => {
      queryClient.setQueryData(queryKeys.savedSentences.detail(sentence.id), sentence);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.savedSentences.list(),
      });
    },
  });
}
