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
      rememberSavedSentence(queryClient, sentence);
    },
  });
}

/** Replace the wording of a sentence this account already saved. */
export function useUpdateSavedSentence(id: string) {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) =>
      unwrapApiResult(savedSentencesApi.updateSavedSentence(client, id, text)),
    onSuccess: (sentence) => {
      rememberSavedSentence(queryClient, sentence);
    },
  });
}

function rememberSavedSentence(
  queryClient: ReturnType<typeof useQueryClient>,
  sentence: SavedSentence,
) {
  queryClient.setQueryData(queryKeys.savedSentences.detail(sentence.id), sentence);
  queryClient.setQueryData<{ items: SavedSentence[] }>(
    queryKeys.savedSentences.list(),
    (current) =>
      current
        ? {
            items: current.items.map((item) =>
              item.id === sentence.id ? sentence : item,
            ),
          }
        : current,
  );
  void queryClient.invalidateQueries({
    queryKey: queryKeys.savedSentences.list(),
  });
}
