"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  createDefaultApiClient,
  dialoguesApi,
  formatApiErrorMessage,
} from "@/lib/api";
import { AppRoutes } from "@/lib/app-routes";
import { markOnboardingComplete } from "@/lib/onboarding-storage";
import { savePracticeFocusQueue } from "@/lib/practice/focus-queue";
import type { DuePracticeItem } from "@/lib/practice/types";
import { onboardingGoals } from "@/lib/site";

type GenerateResponse = {
  dialogue: { title: string; lines: Array<{ speaker: string; text: string; meaningNative: string }> };
  chunks: Array<{ frame: string; meaningNative: string; example: string }>;
  persistence?: { chunkIds: string[]; dialogueId: string; situationId: string };
};

export function OnboardingForm() {
  const router = useRouter();
  const client = useMemo(() => createDefaultApiClient(), []);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [situation, setSituation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedGoal || situation.trim().length === 0 || loading) {
      return;
    }
    setLoading(true);
    setError(null);
    const apiResult = await dialoguesApi.generateDialogue(client, {
      situation: situation.trim(),
      goal: selectedGoal,
      nativeLanguage: "vi",
      targetLanguage: "en",
      level: "beginner",
    });
    setLoading(false);
    if (!apiResult.ok) {
      setError(formatApiErrorMessage(apiResult.error));
      return;
    }
    setResult(apiResult.data as GenerateResponse);
    markOnboardingComplete();
  }

  function startPractice() {
    if (!result?.persistence?.chunkIds?.length) {
      setError(
        "Practice needs persisted chunks (backend DATABASE_URL and DIALOGUE_PERSISTENCE_MODE). Try again when the API is fully configured.",
      );
      return;
    }
    const items: DuePracticeItem[] = result.persistence.chunkIds.map(
      (chunkId, index) => ({
        chunkId,
        text: result.chunks[index]?.example ?? result.chunks[index]?.frame ?? "",
        meaning: result.chunks[index]?.meaningNative ?? "",
        status: "new",
        dueAt: null,
        stability: 0,
        difficulty: 0,
        reps: 0,
        lapses: 0,
      }),
    );
    savePracticeFocusQueue(items);
    router.push(AppRoutes.practiceSession);
  }

  if (result) {
    return (
      <section className="mt-12 space-y-8">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
          <h2 className="text-2xl font-semibold tracking-tight text-emerald-950">
            {result.dialogue.title}
          </h2>
          <ul className="mt-6 space-y-3">
            {result.dialogue.lines.map((line, index) => (
              <li
                key={`${line.speaker}-${index}`}
                className="rounded-xl bg-white/80 px-4 py-3 text-sm"
              >
                <span className="font-semibold capitalize text-emerald-800">
                  {line.speaker}:
                </span>{" "}
                {line.text}
                <p className="mt-1 text-slate-600">{line.meaningNative}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h3 className="text-xl font-semibold">Chunks to practice</h3>
          <ul className="mt-4 space-y-3">
            {result.chunks.map((chunk, index) => (
              <li key={index} className="border-b border-slate-100 pb-3 text-sm">
                <p className="font-medium">{chunk.example || chunk.frame}</p>
                <p className="text-slate-600">{chunk.meaningNative}</p>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={startPractice}
              className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Practice these chunks now
            </button>
            <Link
              href={AppRoutes.today}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-800"
            >
              Go to Today
            </Link>
          </div>
          {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)}>
      {error ? (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}{" "}
          <button
            type="button"
            className="font-semibold underline"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </p>
      ) : null}

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {onboardingGoals.map((goal) => {
          const selected = selectedGoal === goal;
          return (
            <button
              key={goal}
              type="button"
              onClick={() => setSelectedGoal(goal)}
              aria-pressed={selected}
              className={`rounded-2xl border px-5 py-4 text-left text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                selected
                  ? "border-emerald-500 bg-emerald-50 text-emerald-950"
                  : "border-slate-200 bg-white text-slate-800 hover:border-emerald-300 hover:bg-emerald-50"
              }`}
            >
              {goal}
            </button>
          );
        })}
      </div>

      <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Step 2 of 2
        </p>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight">
          What conversation do you need soon?
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Example: &quot;Meeting my professor for the first time.&quot;
        </p>
        <label className="mt-6 block">
          <span className="sr-only">Describe your upcoming conversation</span>
          <textarea
            rows={4}
            value={situation}
            onChange={(event) => setSituation(event.target.value)}
            placeholder="Describe the situation in your own words..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </label>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={
              !selectedGoal || situation.trim().length === 0 || loading
            }
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? "Generating…" : "Generate my practice set"}
          </button>
          <Link
            href={AppRoutes.situations}
            className="text-sm font-medium text-emerald-800 hover:underline"
          >
            Browse situations instead
          </Link>
        </div>
      </section>
    </form>
  );
}
