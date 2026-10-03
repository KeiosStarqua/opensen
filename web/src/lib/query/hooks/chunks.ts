import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { chunksApi } from "@/lib/api";
import type { SentencePattern } from "@/lib/drills/drill-generator";

import { unwrapApiResult } from "../api-query";
import { useApiClient } from "../query-provider";
import { queryKeys } from "../query-keys";

export type ChunkSummary = {
  id: string;
  text: string;
  meaning: string;
  register: string;
  level: string;
};

export type ChunkDetail = ChunkSummary & {
  editable: boolean;
  patternId: string | null;
  situation: { id: string; name: string } | null;
};

export type ChunkListQuery = { q?: string; register?: string; limit?: number };

/** Library search. Keeps the previous results on screen while a new filter loads. */
export function useChunks(query: ChunkListQuery) {
  const client = useApiClient();
  return useQuery({
    queryKey: queryKeys.chunks.list(query),
    queryFn: async () =>
      (await unwrapApiResult(chunksApi.listChunks(client, query))) as {
        items?: ChunkSummary[];
      },
    select: (data) => data.items ?? [],
    placeholderData: keepPreviousData,
  });
}

export function useChunk(id: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: queryKeys.chunks.detail(id),
    queryFn: async () =>
      (await unwrapApiResult(chunksApi.getChunk(client, id))) as ChunkDetail,
  });
}

export function useSentencePattern(patternId: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: queryKeys.chunks.pattern(patternId),
    queryFn: async () =>
      (
        (await unwrapApiResult(chunksApi.getPatternById(client, patternId))) as {
          pattern: SentencePattern;
        }
      ).pattern,
  });
}

export function useCreateChunk() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: unknown) =>
      (await unwrapApiResult(chunksApi.createChunk(client, body))) as {
        id: string;
      },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chunks.lists() });
    },
  });
}

/** Edit a learner-owned chunk; the detail cache takes the server response. */
export function useUpdateChunk(id: string) {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { text: string; meaning: string }) =>
      (await unwrapApiResult(
        chunksApi.updateChunk(client, id, body),
      )) as Partial<ChunkDetail>,
    onSuccess: (updated) => {
      queryClient.setQueryData<ChunkDetail>(
        queryKeys.chunks.detail(id),
        (previous) => (previous ? { ...previous, ...updated } : previous),
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.chunks.lists() });
      // Practice items embed chunk text and meaning.
      void queryClient.invalidateQueries({ queryKey: queryKeys.practice.all });
    },
  });
}
