"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { dialoguesApi } from "@/lib/api";

import { unwrapApiResult } from "../api-query";
import { useApiClient } from "../query-provider";
import { queryKeys } from "../query-keys";

export type SavedDialogue = {
  title: string;
  level: string;
  lines: Array<{ speaker: string; text: string }>;
  chunks: Array<{ id: string; text: string; meaning: string }>;
};

export type GenerateDialogueRequest = {
  situation: string;
  role?: string;
  otherSpeaker?: string;
  goal?: string;
  tone?: string;
  level?: string;
  nativeLanguage?: string;
  targetLanguage?: string;
};

export type GeneratedDialogue = {
  dialogue: {
    title: string;
    lines: Array<{ speaker: string; text: string; meaningNative?: string }>;
  };
  chunks: Array<{ frame?: string; example?: string; meaningNative: string }>;
  persistence?: { dialogueId: string; chunkIds: string[]; situationId?: string };
};

export function useDialogue(id: string) {
  const client = useApiClient();
  return useQuery({
    queryKey: queryKeys.dialogues.detail(id),
    queryFn: async () =>
      (await unwrapApiResult(
        dialoguesApi.getDialogue(client, id),
      )) as SavedDialogue,
  });
}

/**
 * Generate (and, when the API persists it, enroll) a dialogue. On success the
 * learner owns new chunks and plan entries, so those caches refresh.
 */
export function useGenerateDialogue() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: GenerateDialogueRequest) =>
      (await unwrapApiResult(
        dialoguesApi.generateDialogue(client, body),
      )) as GeneratedDialogue,
    onSuccess: (generated) => {
      if (!generated.persistence) return;
      for (const queryKey of [
        queryKeys.chunks.lists(),
        queryKeys.practice.all,
        queryKeys.dialogues.all,
        queryKeys.situations.all,
      ]) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}
