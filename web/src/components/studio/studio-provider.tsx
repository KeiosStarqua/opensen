import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  defaultPractice,
  initialTopicProgress,
} from "@/lib/studio/content";
import {
  applyReward,
  lessonPractice,
  type PracticeDeck,
} from "@/lib/studio/model";

type StudioState = {
  name: string;
  streak: number;
  points: number;
  sentencesLearned: number;
  topicProgress: typeof initialTopicProgress;
  hearts: number;
  practice: PracticeDeck;
};

type StudioContextValue = StudioState & {
  loseHeart: () => number;
  refillHearts: () => void;
  startLessonPractice: (text: string, meaning: string) => void;
  advancePractice: () => void;
  resetPracticeDeck: () => void;
  claimReward: (token: string) => void;
};

const initialState: StudioState = {
  name: "Minh",
  streak: 3,
  points: 120,
  sentencesLearned: 18,
  topicProgress: initialTopicProgress,
  hearts: 3,
  practice: defaultPractice,
};

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StudioState>(initialState);
  const claimed = useRef(new Set<string>());
  const heartsRef = useRef(initialState.hearts);

  const loseHeart = useCallback(() => {
    const next = Math.max(0, heartsRef.current - 1);
    heartsRef.current = next;
    setState((current) => ({ ...current, hearts: next }));
    return next;
  }, []);

  const refillHearts = useCallback(() => {
    heartsRef.current = 3;
    setState((current) => ({ ...current, hearts: 3 }));
  }, []);

  const startLessonPractice = useCallback((text: string, meaning: string) => {
    heartsRef.current = 3;
    setState((current) => ({
      ...current,
      hearts: 3,
      practice: lessonPractice(text, meaning),
    }));
  }, []);

  const advancePractice = useCallback(() => {
    setState((current) => ({
      ...current,
      practice: {
        ...current.practice,
        index: Math.min(current.practice.items.length - 1, current.practice.index + 1),
      },
    }));
  }, []);

  const resetPracticeDeck = useCallback(() => {
    heartsRef.current = 3;
    setState((current) => ({
      ...current,
      hearts: 3,
      practice: defaultPractice,
    }));
  }, []);

  const claimReward = useCallback((token: string) => {
    if (!token || claimed.current.has(token)) return;
    claimed.current.add(token);
    setState((current) => applyReward(current));
  }, []);

  const value = useMemo<StudioContextValue>(
    () => ({
      ...state,
      loseHeart,
      refillHearts,
      startLessonPractice,
      advancePractice,
      resetPracticeDeck,
      claimReward,
    }),
    [
      state,
      loseHeart,
      refillHearts,
      startLessonPractice,
      advancePractice,
      resetPracticeDeck,
      claimReward,
    ],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const value = useContext(StudioContext);
  if (!value) {
    throw new Error("useStudio must be used inside StudioProvider");
  }
  return value;
}
