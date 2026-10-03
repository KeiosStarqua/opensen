import { AppLink } from "@/components/app-link";
import { RecallPromptSkeleton } from "@/components/practice/practice-loading";
import { useEffect, useMemo, useState } from "react";

import { AppRoutes } from "@/lib/app-routes";
import { isCorrect, similarity } from "@/lib/practice/answer-matcher";
import { consumePracticeFocusQueue } from "@/lib/practice/focus-queue";
import { buildPracticeItem } from "@/lib/practice/practice-item";
import { queryErrorMessage, queryErrorStatus } from "@/lib/query/api-query";
import {
  usePracticeSessionDeck,
  useSubmitReview,
} from "@/lib/query/hooks/practice";
import { getLearnerSettings } from "@/lib/settings/learner-settings";
import { canSpeak as speechAvailable, speak as speakNow } from "@/lib/speech/speak";
import type { DuePracticeItem, ReviewRating } from "@/lib/practice/types";

type Step = "prompt" | "reveal" | "finished";
type Phase = Step | "loading" | "empty" | "error";

const GRADES: { rating: ReviewRating; label: string }[] = [
  { rating: "forgot", label: "Forgot" },
  { rating: "hard", label: "Hard" },
  { rating: "good", label: "Good" },
  { rating: "easy", label: "Easy" },
];

export function PracticeSession() {
  const canSpeak = speechAvailable();

  // Items handed over by Today/Plan/Library/Dialog Builder; null means
  // "practice whatever is due".
  const [focusQueue, setFocusQueue] = useState<DuePracticeItem[] | null>(() => {
    const handedOver = consumePracticeFocusQueue();
    return handedOver && handedOver.length > 0 ? handedOver : null;
  });
  const [deckLimit] = useState(() => getLearnerSettings().sessionSize);
  const deck = usePracticeSessionDeck(deckLimit, {
    enabled: focusQueue === null,
  });
  const review = useSubmitReview();

  const [step, setStep] = useState<Step>("prompt");
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [completed, setCompleted] = useState(0);

  const queue = useMemo(
    () => focusQueue ?? deck.data ?? [],
    [focusQueue, deck.data],
  );
  const reviewMissing = queryErrorStatus(review.error) === 404;
  const phase: Phase =
    focusQueue === null && deck.isPending
      ? "loading"
      : (focusQueue === null && deck.isError) || reviewMissing
        ? "error"
        : queue.length === 0
          ? "empty"
          : step;
  const errorMessage = queryErrorMessage(
    focusQueue === null && deck.isError ? deck.error : review.error,
  );

  const currentDue = queue[index];
  const currentItem = useMemo(
    () => (currentDue ? buildPracticeItem(currentDue, canSpeak) : null),
    [currentDue, canSpeak],
  );

  function restartFromDue() {
    review.reset();
    setStep("prompt");
    setIndex(0);
    setAnswer("");
    setMatchScore(null);
    if (focusQueue !== null) {
      setFocusQueue(null);
    } else {
      void deck.refetch();
    }
  }

  useEffect(() => {
    const settings = getLearnerSettings();
    if (
      phase !== "prompt" ||
      !currentItem?.spokenText ||
      !canSpeak ||
      !settings.ttsEnabled
    ) {
      return;
    }
    speakNow(currentItem.spokenText, {
      rate: settings.speechRate,
      surface: "practice-session",
    });
  }, [phase, currentItem, canSpeak]);

  function reveal() {
    if (!currentItem) return;
    const typed = answer.trim();
    if (typed.length > 0) {
      setMatchScore(similarity(currentItem.expected, typed));
    } else {
      setMatchScore(null);
    }
    setStep("reveal");
    const settings = getLearnerSettings();
    if (currentItem.mode !== "listenRepeat" && canSpeak && settings.ttsEnabled) {
      speakNow(currentItem.expected, {
        rate: settings.speechRate,
        interrupt: false,
        surface: "practice-session",
      });
    }
  }

  function submitGrade(rating: ReviewRating) {
    if (!currentDue || review.isPending) return;
    review.mutate(
      { chunkId: currentDue.chunkId, rating },
      {
        onSuccess: () => {
          setCompleted((count) => count + 1);
          setAnswer("");
          setMatchScore(null);
          if (index + 1 >= queue.length) {
            setStep("finished");
            return;
          }
          setIndex(index + 1);
          setStep("prompt");
        },
      },
    );
  }

  if (phase === "loading") {
    return (
      <ScreenShell title="Practice session">
        <RecallPromptSkeleton />
      </ScreenShell>
    );
  }

  if (phase === "empty") {
    return (
      <ScreenShell title="Nothing due yet">
        <p className="text-lg text-slate-600">
          Enroll chunks from Situations or Dialog Builder to start recall
          practice.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <AppLink
            href={AppRoutes.situations}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            Browse Situations
          </AppLink>
          <AppLink
            href={AppRoutes.home}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to Home
          </AppLink>
        </div>
      </ScreenShell>
    );
  }

  if (phase === "error") {
    return (
      <ScreenShell title="Practice unavailable">
        <p className="text-lg text-red-700">{errorMessage}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={restartFromDue}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
          >
            Retry
          </button>
          <AppLink
            href={AppRoutes.situations}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium"
          >
            Situations
          </AppLink>
        </div>
      </ScreenShell>
    );
  }

  if (phase === "finished") {
    return (
      <ScreenShell title="Session complete">
        <p className="text-lg text-slate-600">
          You graded {completed} item{completed === 1 ? "" : "s"}. Scheduling
          updates on the server — check Today or Plan next.
        </p>
        <AppLink
          href={AppRoutes.home}
          className="mt-6 inline-block rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
        >
          Back to Home
        </AppLink>
      </ScreenShell>
    );
  }

  if (!currentItem) {
    return null;
  }

  return (
    <ScreenShell
      title="Recall practice"
      subtitle={`${index + 1} of ${queue.length}`}
    >
      {errorMessage ? (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {errorMessage}
        </p>
      ) : null}

      <p className="text-sm font-medium uppercase tracking-wide text-emerald-800">
        {currentItem.mode}
      </p>
      <p className="mt-3 text-xl font-semibold leading-snug">
        {currentItem.prompt}
      </p>

      {phase === "prompt" ? (
        <div className="mt-8 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Your answer (type to produce the sentence)
            <textarea
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base"
              rows={3}
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Speak or type your answer…"
            />
          </label>
          {currentItem.hint ? (
            <p className="text-sm text-slate-500">Hint: {currentItem.hint}</p>
          ) : null}
          <button
            type="button"
            onClick={reveal}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Check answer
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Expected</p>
            <p className="mt-1 text-lg font-medium">{currentItem.expected}</p>
            {matchScore !== null ? (
              <p className="mt-2 text-sm text-slate-600">
                Match: {Math.round(matchScore * 100)}%
                {isCorrect(matchScore) ? " — close enough" : ""}
              </p>
            ) : null}
          </div>
          <p className="text-sm text-slate-600">
            How well did you recall it? Your rating updates FSRS on the server.
          </p>
          <div className="flex flex-wrap gap-2">
            {GRADES.map((option) => (
              <button
                key={option.rating}
                type="button"
                disabled={review.isPending}
                onClick={() => submitGrade(option.rating)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </ScreenShell>
  );
}

function ScreenShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-[#f8f6f2] text-slate-900">
      <header className="border-b border-slate-200/80 px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-baseline justify-between">
          <h1 className="text-lg font-semibold">{title}</h1>
          {subtitle ? (
            <span className="text-sm text-slate-500">{subtitle}</span>
          ) : null}
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-8">{children}</main>
    </div>
  );
}
