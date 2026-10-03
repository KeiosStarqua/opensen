import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { savedSentencesApi } from "@/lib/api";
import type { SavedSentence } from "@/lib/api/routes/saved-sentences";
import {
  isTextSaved,
  sentenceSaveChange,
} from "@/lib/saved-sentences/library-list";

import { queryErrorMessage, unwrapApiResult } from "../api-query";
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

export function useUnsaveSentences() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await unwrapApiResult(savedSentencesApi.deleteSavedSentence(client, id));
      }
    },
    onSuccess: (_data, ids) => {
      for (const id of ids) {
        queryClient.removeQueries({
          queryKey: queryKeys.savedSentences.detail(id),
        });
      }
      void queryClient.invalidateQueries({
        queryKey: queryKeys.savedSentences.list(),
      });
    },
  });
}

/** Library stars and `/saved` unsaves share this account list. */
export function useSavedSentenceListActions() {
  const list = useSavedSentences();
  const save = useSaveSentence();
  const unsave = useUnsaveSentences();
  const rows = list.data;

  function toggleText(text: string) {
    if (!rows || save.isPending || unsave.isPending) return;
    const change = sentenceSaveChange(text, rows);
    if (change.action === "save") save.mutate(change.text);
    else unsave.mutate(change.ids);
  }

  function unsaveId(id: string) {
    if (unsave.isPending) return;
    unsave.mutate([id]);
  }

  return {
    list,
    rows,
    isSaved: (text: string) => (rows ? isTextSaved(text, rows) : false),
    toggleText,
    unsaveId,
    pending: save.isPending || unsave.isPending,
    error: queryErrorMessage(save.error) ?? queryErrorMessage(unsave.error),
    listError: rows ? null : queryErrorMessage(list.error),
  };
}
