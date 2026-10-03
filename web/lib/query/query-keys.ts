/**
 * Query key factory. Every key starts with its domain so a mutation can
 * invalidate a whole domain (`queryKeys.practice.all`) or one entry.
 */
export const queryKeys = {
  situations: {
    all: ["situations"] as const,
    list: (query: { limit?: number }) =>
      ["situations", "list", query] as const,
    detail: (id: string) => ["situations", "detail", id] as const,
  },
  chunks: {
    all: ["chunks"] as const,
    lists: () => ["chunks", "list"] as const,
    list: (query: { q?: string; register?: string; limit?: number }) =>
      ["chunks", "list", query] as const,
    detail: (id: string) => ["chunks", "detail", id] as const,
    pattern: (patternId: string) => ["chunks", "pattern", patternId] as const,
  },
  dialogues: {
    all: ["dialogues"] as const,
    detail: (id: string) => ["dialogues", "detail", id] as const,
  },
  savedSentences: {
    all: ["savedSentences"] as const,
    list: () => ["savedSentences", "list"] as const,
    detail: (id: string) => ["savedSentences", "detail", id] as const,
  },
  practice: {
    all: ["practice"] as const,
    plan: () => ["practice", "plan"] as const,
    due: (query: { limit?: number }) => ["practice", "due", query] as const,
  },
  /**
   * Snapshot of the deck for one recall session. Deliberately outside the
   * `practice` prefix: grading invalidates `practice`, and the running
   * session must not reshuffle under the learner.
   */
  practiceSessionDeck: (limit: number) => ["practiceSessionDeck", limit] as const,
} as const;
