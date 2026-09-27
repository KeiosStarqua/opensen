"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createDefaultApiClient,
  formatApiErrorMessage,
  practiceApi,
} from "@/lib/api";
import { AppRoutes } from "@/lib/app-routes";
import { isCorrect, similarity } from "@/lib/practice/answer-matcher";
import { buildPracticeItem } from "@/lib/practice/practice-item";
import type { DuePracticeItem, ReviewRating } from "@/lib/practice/types";

type Phase = "loading" | "prompt" | "reveal" | "finished" | "empty" | "error";

const GRADES: { rating: ReviewRating; label: string }[] = [
  { rating: "forgot", label: "Forgot" },
  { rating: "hard", label: "Hard" },
  { rating: "good", label: "Good" },
  { rating: "easy", label: "Easy" },
];

export function PracticeSession() {
  const client = useMemo(() => createDefaultApiClient(), []);
  const canSpeak =
    typeof window !== "undefined" &&
    typeof window.speechSynthesis !== "undefined";

  const [phase, setPhase] = useState<Phase>("loading");
  const [queue, setQueue] = useState<DuePracticeItem[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [completed, setCompleted] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [grading, setGrading] = useState(false);

  const currentDue = queue[index];
  const currentItem = currentDue
    ? buildPracticeItem(currentDue, canSpeak)
    : null;

  const loadDue = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setPhase("loading");
    }
    setErrorMessage(null);
    const result = await practiceApi.getPracticeDue(client, { limit: 20 });
    if (!result.ok) {
      setErrorMessage(formatApiErrorMessage(result.error));
      setPhase("error");
      return;
    }
    if (result.data.items.length === 0) {
      setPhase("empty");
      return;
    }
    setQueue(result.data.items);
    setIndex(0);
    setPhase("prompt");
  }, [client]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const result = await practiceApi.getPracticeDue(client, { limit: 20 });
      if (!active) return;
      if (!result.ok) {
        setErrorMessage(formatApiErrorMessage(result.error));
        setPhase("error");
        return;
      }
      if (result.data.items.length === 0) {
        setPhase("empty");
        return;
      }
      setQueue(result.data.items);
      setIndex(0);
      setPhase("prompt");
    })();
    return () => {
      active = false;
    };
  }, [client]);

  useEffect(() => {
    if (phase !== "prompt" || !currentItem?.spokenText || !canSpeak) return;
    const utterance = new SpeechSynthesisUtterance(currentItem.spokenText);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [phase, currentItem, canSpeak]);

  function reveal() {
    if (!currentItem) return;
    const typed = answer.trim();
    if (typed.length > 0) {
      setMatchScore(similarity(currentItem.expected, typed));
    } else {
      setMatchScore(null);
    }
    setPhase("reveal");
    if (currentItem.mode !== "listenRepeat" && canSpeak) {
      const utterance = new SpeechSynthesisUtterance(currentItem.expected);
      window.speechSynthesis.speak(utterance);
    }
  }

  async function submitGrade(rating: ReviewRating) {
    if (!currentDue || grading) return;
    setGrading(true);
    setErrorMessage(null);
    const result = await practiceApi.postPracticeReview(client, {
      chunkId: currentDue.chunkId,
      rating,
    });
    setGrading(false);
    if (!result.ok) {
      setErrorMessage(formatApiErrorMessage(result.error));
      if (result.error.status === 404) {
        setPhase("error");
      }
      return;
    }
    const nextCompleted = completed + 1;
    setCompleted(nextCompleted);
    setAnswer("");
    setMatchScore(null);
    if (index + 1 >= queue.length) {
      setPhase("finished");
      return;
    }
    setIndex(index + 1);
    setPhase("prompt");
  }

  if (phase === "loading") {
    return (
      <ScreenShell title="Practice session">
        <p className="text-slate-600">Loading due items…</p>
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
          <Link
            href={AppRoutes.situations}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            Browse Situations
          </Link>
          <Link
            href={AppRoutes.today}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to Today
          </Link>
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
            onClick={() => void loadDue(true)}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
          >
            Retry
          </button>
          <Link
            href={AppRoutes.situations}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium"
          >
            Situations
          </Link>
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
        <Link
          href={AppRoutes.today}
          className="mt-6 inline-block rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
        >
          Back to Today
        </Link>
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
                disabled={grading}
                onClick={() => void submitGrade(option.rating)}
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
