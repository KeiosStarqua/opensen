export const REVIEW_RATINGS = ["forgot", "hard", "good", "easy"] as const;
export type ReviewRating = (typeof REVIEW_RATINGS)[number];

export type ChunkStatus = "new" | "learning" | "review" | "relearning";

export type DuePracticeItem = {
  chunkId: string;
  text: string;
  meaning: string;
  status: ChunkStatus;
  dueAt: string | null;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
};

export type DuePracticeResponse = {
  items: DuePracticeItem[];
  nextCursor: string | null;
};

export type PracticeMode =
  | "listenRepeat"
  | "l1ToL2"
  | "cloze"
  | "slotSwap";

export type PracticeItem = {
  chunkId: string;
  mode: PracticeMode;
  prompt: string;
  expected: string;
  spokenText?: string;
  hint?: string;
};
