export type PracticeKind = "order" | "speak";

export type PracticeItem = {
  kind: PracticeKind;
  text: string;
  meaning: string;
};

export type PracticeDeck = {
  index: number;
  items: PracticeItem[];
};

export type TopicProgress = {
  done: number;
  total: number;
};

export type RewardState = {
  streak: number;
  points: number;
  sentencesLearned: number;
  topicProgress: Record<string, TopicProgress>;
};

export function wordsOf(text: string): string[] {
  return text
    .replace(/[?.!,"]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

export function sameOrder(placed: string[], targetText: string): boolean {
  const target = wordsOf(targetText);
  return (
    placed.length === target.length &&
    placed.every((word, index) => word === target[index])
  );
}

export function scrambledWords(text: string): string[] {
  const words = wordsOf(text);
  if (words.length <= 1) return words;
  const preferred = [2, 0, 4, 3, 1, 5, 6, 7, 8];
  const order = preferred.filter((index) => index < words.length);
  for (let index = 0; index < words.length; index += 1) {
    if (!order.includes(index)) order.push(index);
  }
  const scrambled = order.map((index) => words[index]);
  if (scrambled.join(" ") === words.join(" ")) {
    return [words[words.length - 1], ...words.slice(0, -1)];
  }
  return scrambled;
}

/** Mid-puzzle layout from the word-order screen, for the passport sentence. */
export function openingPlacement(text: string): {
  placed: string[];
  bank: string[];
} {
  const words = wordsOf(text);
  if (words.join(" ") === "May I see your passport") {
    return { placed: ["see", "May", "passport", "your"], bank: ["I"] };
  }
  return { placed: [], bank: scrambledWords(text) };
}

/**
 * Locks the next correct word in place and returns every other loose word
 * to the bank. A correct prefix is kept.
 */
export function applyHint(
  targetText: string,
  placed: string[],
  bank: string[],
): { placed: string[]; bank: string[] } {
  const target = wordsOf(targetText);
  let correctPrefix = 0;
  while (
    correctPrefix < placed.length &&
    placed[correctPrefix] === target[correctPrefix]
  ) {
    correctPrefix += 1;
  }
  if (correctPrefix >= target.length) {
    return { placed: [...placed], bank: [...bank] };
  }

  const nextPlaced = target.slice(0, correctPrefix + 1);
  const used = new Map<string, number>();
  for (const word of nextPlaced) {
    used.set(word, (used.get(word) ?? 0) + 1);
  }
  const rest = [...placed.slice(correctPrefix), ...bank].filter((word) => {
    const remaining = used.get(word) ?? 0;
    if (remaining > 0) {
      used.set(word, remaining - 1);
      return false;
    }
    return true;
  });
  return { placed: nextPlaced, bank: rest };
}

export function lessonPractice(text: string, meaning: string): PracticeDeck {
  return {
    index: 0,
    items: [
      { kind: "order", text, meaning },
      { kind: "speak", text, meaning },
    ],
  };
}

export function applyReward<T extends RewardState>(state: T): T {
  const travel = state.topicProgress.travel;
  return {
    ...state,
    streak: state.streak + 1,
    points: state.points + 10,
    sentencesLearned: state.sentencesLearned + 3,
    topicProgress: {
      ...state.topicProgress,
      ...(travel
        ? {
            travel: {
              ...travel,
              done: Math.min(travel.total, travel.done + 3),
            },
          }
        : {}),
    },
  };
}
