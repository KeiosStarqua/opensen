"use client";

import {
  AirplaneTiltIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  CaretRightIcon,
  ChatsCircleIcon,
  CheckCircleIcon,
  DotsThreeIcon,
  GraduationCapIcon,
  HeartIcon,
  SpeakerHighIcon,
  type Icon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { BrandMark } from "@/components/brand-mark";
import {
  createDefaultApiClient,
  dialoguesApi,
  formatApiErrorMessage,
} from "@/lib/api";
import { AppRoutes } from "@/lib/app-routes";
import {
  goalByLabel,
  onboardingGoals,
  SITUATION_MAX_LENGTH,
  type OnboardingGoal,
  type OnboardingPreviewLine,
} from "@/lib/onboarding-goals";
import { markOnboardingComplete } from "@/lib/onboarding-storage";
import { savePracticeFocusQueue } from "@/lib/practice/focus-queue";
import type { DuePracticeItem } from "@/lib/practice/types";
import { siteConfig } from "@/lib/site";

type GenerateResponse = {
  dialogue: {
    title: string;
    lines: Array<{ speaker: string; text: string; meaningNative: string }>;
  };
  chunks: Array<{ frame: string; meaningNative: string; example: string }>;
  persistence?: { chunkIds: string[]; dialogueId: string; situationId: string };
};

const goalIcons: Record<OnboardingGoal["id"], Icon> = {
  travel: AirplaneTiltIcon,
  work: BriefcaseIcon,
  study: GraduationCapIcon,
  daily: ChatsCircleIcon,
  social: HeartIcon,
  custom: DotsThreeIcon,
};

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function OnboardingExperience() {
  const router = useRouter();
  const client = useMemo(() => createDefaultApiClient(), []);
  const previewRef = useRef<HTMLElement>(null);
  const [selectedLabel, setSelectedLabel] = useState<string>(onboardingGoals[0].label);
  const [situation, setSituation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const goal = goalByLabel(selectedLabel);

  useEffect(() => {
    if (!result) return;
    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

  function selectGoal(label: string) {
    setSelectedLabel(label);
    setResult(null);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (situation.trim().length === 0 || loading) return;
    setLoading(true);
    setError(null);
    const apiResult = await dialoguesApi.generateDialogue(client, {
      situation: situation.trim(),
      goal: selectedLabel,
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
    const items: DuePracticeItem[] = result.persistence.chunkIds.map((chunkId, index) => ({
      chunkId,
      text: result.chunks[index]?.example ?? result.chunks[index]?.frame ?? "",
      meaning: result.chunks[index]?.meaningNative ?? "",
      status: "new",
      dueAt: null,
      stability: 0,
      difficulty: 0,
      reps: 0,
      lapses: 0,
    }));
    savePracticeFocusQueue(items);
    router.push(AppRoutes.practiceSession);
  }

  const canGenerate = situation.trim().length > 0 && !loading;

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-40 h-56 w-56 rounded-full bg-[#d7efd4]/80 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-24 h-48 w-48 rounded-full bg-[#dcefd4]/70 blur-3xl"
      />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[#5e6f68] hover:text-[#173028]"
        >
          <ArrowLeftIcon size={16} />
          Back to home
        </Link>
        <p className="flex items-center gap-2 text-sm font-extrabold text-[#173028]">
          <BrandMark className="h-7 w-7" />
          {siteConfig.name}
        </p>
      </header>

      <main className="relative mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <form onSubmit={(event) => void handleSubmit(event)}>
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:gap-10">
            <div>
              <ScenePanel goal={goal} className="mb-6 lg:hidden" />

              <p className="text-[11px] font-extrabold tracking-[0.18em] text-[#1c8f4e]">
                STEP 1 OF 2
              </p>
              <h1 className="mt-3 max-w-xl text-3xl font-extrabold leading-[1.12] tracking-tight sm:text-4xl">
                What do you want to speak English for?
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#5e6f68] sm:text-base">
                Pick the closest match. OpenSen will shape your first practice set
                around a real conversation you need soon.
              </p>

              <div
                role="radiogroup"
                aria-label="What you want to speak English for"
                className="mt-6 grid gap-3 sm:grid-cols-2"
              >
                {onboardingGoals.map((option) => (
                  <GoalOption
                    key={option.id}
                    goal={option}
                    selected={option.label === selectedLabel}
                    onSelect={() => selectGoal(option.label)}
                  />
                ))}
              </div>

              <section className="mt-6 rounded-[28px] bg-white p-5 shadow-[0_16px_40px_rgba(23,48,40,0.06)] sm:p-6">
                <p className="text-[11px] font-extrabold tracking-[0.18em] text-[#1c8f4e]">
                  STEP 2 OF 2
                </p>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight">
                  What conversation do you need soon?
                </h2>
                <p className="mt-2 text-sm text-[#5e6f68]">
                  Example: &quot;{goal.example}&quot;
                </p>
                <label className="mt-4 block">
                  <span className="sr-only">Describe your upcoming conversation</span>
                  <textarea
                    rows={4}
                    maxLength={SITUATION_MAX_LENGTH}
                    value={situation}
                    onChange={(event) => setSituation(event.target.value)}
                    placeholder={goal.example}
                    className="w-full resize-none rounded-2xl border border-[#d7e4db] bg-[#fbfcfb] px-4 py-3 text-sm leading-6 text-[#173028] placeholder:text-[#9aada3] focus:border-[#1c8f4e] focus:outline-none focus:ring-2 focus:ring-[#c8ead4]"
                  />
                </label>
                <p
                  className={`text-right text-xs font-bold ${
                    situation.length > SITUATION_MAX_LENGTH - 40
                      ? "text-[#c47b12]"
                      : "text-[#8aa093]"
                  }`}
                >
                  {situation.length}/{SITUATION_MAX_LENGTH}
                </p>

                {error ? (
                  <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
                    {error}{" "}
                    <button
                      type="button"
                      className="font-extrabold underline"
                      onClick={() => setError(null)}
                    >
                      Dismiss
                    </button>
                  </p>
                ) : null}

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="submit"
                    disabled={!canGenerate}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#178a45] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#12753a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#178a45] disabled:cursor-not-allowed disabled:bg-[#c5d5cb]"
                  >
                    {loading
                      ? "Generating…"
                      : result
                        ? "Generate again"
                        : "Generate my practice set"}
                    {loading ? null : <ArrowRightIcon size={16} weight="bold" />}
                  </button>
                  <Link
                    href={AppRoutes.situations}
                    className="text-sm font-extrabold text-[#178a45] underline decoration-[#178a45]/40 underline-offset-4 hover:decoration-[#178a45]"
                  >
                    Browse situations instead
                  </Link>
                </div>
              </section>
            </div>

            <ScenePanel goal={goal} className="sticky top-6 hidden lg:block" />
          </div>
        </form>

        <PracticePreview
          ref={previewRef}
          goal={goal}
          result={result}
          loading={loading}
          onPractice={startPractice}
        />
      </main>
    </div>
  );
}

function GoalOption({
  goal,
  selected,
  onSelect,
}: {
  goal: OnboardingGoal;
  selected: boolean;
  onSelect: () => void;
}) {
  const GoalIcon = goalIcons[goal.id];
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex items-center gap-3 rounded-[18px] border px-3 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#178a45] ${
        selected
          ? "border-[#8ed4a8] bg-[#f3fbf6]"
          : "border-[#e4eee6] bg-white hover:border-[#b7dcc4]"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          selected ? "bg-white text-[#178a45]" : "bg-[#f3faf6] text-[#3d6b52]"
        }`}
      >
        <GoalIcon size={18} weight={selected ? "fill" : "regular"} />
      </span>
      <span className="min-w-0 flex-1 text-sm font-extrabold text-[#173028]">{goal.label}</span>
      {selected ? (
        <CheckCircleIcon size={22} weight="fill" className="shrink-0 text-[#1c8f4e]" />
      ) : (
        <CaretRightIcon size={16} className="shrink-0 text-[#9aada3]" />
      )}
    </button>
  );
}

function ScenePanel({ goal, className }: { goal: OnboardingGoal; className?: string }) {
  return (
    <div className={className}>
      <div className="relative h-64 overflow-hidden rounded-[28px] lg:h-[min(640px,calc(100vh-6rem))]">
        <img
          src={goal.scene}
          alt={goal.sceneAlt}
          className="h-full w-full object-cover object-[center_78%]"
        />
        <div className="absolute left-3 top-3 max-w-[230px] rounded-2xl rounded-bl-md bg-white/95 px-3 py-2.5 shadow-[0_10px_24px_rgba(23,48,40,0.12)]">
          <p className="flex items-start gap-2 text-sm font-extrabold leading-snug text-[#173028]">
            <button
              type="button"
              onClick={() => speak(goal.prompt)}
              aria-label={`Play: ${goal.prompt}`}
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e7f6ec] text-[#178a45] hover:bg-[#d4f0de]"
            >
              <SpeakerHighIcon size={14} weight="fill" />
            </button>
            <span>{goal.prompt}</span>
          </p>
          <p className="mt-1.5 text-[11px] leading-snug text-[#5e6f68]">
            <span className="font-extrabold text-[#1c8f4e]">Nghĩa là:</span> {goal.meaning}
          </p>
        </div>
      </div>
    </div>
  );
}

function PracticePreview({
  ref,
  goal,
  result,
  loading,
  onPractice,
}: {
  ref: React.RefObject<HTMLElement | null>;
  goal: OnboardingGoal;
  result: GenerateResponse | null;
  loading: boolean;
  onPractice: () => void;
}) {
  const GoalIcon = goalIcons[goal.id];
  const title = result?.dialogue.title || goal.previewTitle;
  const lines: OnboardingPreviewLine[] = result
    ? result.dialogue.lines.map((line) => ({
        speaker: line.speaker === "learner" ? "learner" : "other",
        text: line.text,
      }))
    : [...goal.lines];
  const meanings = result ? result.dialogue.lines.map((line) => line.meaningNative) : [];
  const chunks = result
    ? result.chunks.map((chunk) => ({
        text: chunk.example || chunk.frame,
        meaning: chunk.meaningNative,
      }))
    : goal.chunks.map((text) => ({ text, meaning: "" }));

  return (
    <section
      ref={ref}
      className="mt-8 scroll-mt-6 rounded-[28px] bg-[#e7f6ec] p-5 sm:p-6"
      aria-busy={loading}
    >
      <p className="text-[11px] font-extrabold tracking-[0.16em] text-[#1c8f4e]">
        {result ? "READY · YOUR PRACTICE SET" : "PREVIEW · YOUR FIRST PRACTICE SET"}
      </p>
      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(220px,0.7fr)] lg:items-start">
        <div>
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#178a45]">
              <GoalIcon size={22} weight="fill" />
            </span>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">{title}</h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-[#5e6f68]">
                {result
                  ? "Lines and chunks from the conversation you described."
                  : goal.previewSummary}
              </p>
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            {lines.map((line, index) => (
              <li
                key={`${line.speaker}-${index}`}
                className="flex items-start gap-3 rounded-2xl bg-white px-3 py-2.5"
              >
                {line.speaker === "learner" ? (
                  <img
                    src="/studio/sen-bust.png"
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-full object-cover object-[center_20%]"
                  />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d7efe4] text-xs font-extrabold text-[#178a45]">
                    A
                  </span>
                )}
                <p className="min-w-0 flex-1 pt-1 text-sm font-bold leading-snug text-[#173028]">
                  {line.text}
                  {meanings[index] ? (
                    <span className="mt-0.5 block text-xs font-semibold text-[#6b7c73]">
                      {meanings[index]}
                    </span>
                  ) : null}
                </p>
                <button
                  type="button"
                  onClick={() => speak(line.text)}
                  aria-label={`Play: ${line.text}`}
                  className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#178a45] hover:bg-[#e7f6ec]"
                >
                  <SpeakerHighIcon size={18} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-white p-4">
          <h3 className="text-sm font-extrabold text-[#173028]">Chunks to practice</h3>
          <ul className="mt-2">
            {chunks.map((chunk, index) => (
              <li
                key={`${chunk.text}-${index}`}
                className="flex items-center gap-3 border-b border-[#eef4f0] py-2.5 last:border-b-0"
              >
                <p className="min-w-0 flex-1 text-sm font-bold text-[#173028]">
                  {chunk.text}
                  {chunk.meaning ? (
                    <span className="mt-0.5 block text-xs font-semibold text-[#6b7c73]">
                      {chunk.meaning}
                    </span>
                  ) : null}
                </p>
                <button
                  type="button"
                  onClick={() => speak(chunk.text)}
                  aria-label={`Play: ${chunk.text}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#178a45] hover:bg-[#e7f6ec]"
                >
                  <SpeakerHighIcon size={18} />
                </button>
              </li>
            ))}
          </ul>
          {result ? (
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={onPractice}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#178a45] px-4 py-2.5 text-sm font-extrabold text-white hover:bg-[#12753a]"
              >
                Practice these chunks
                <ArrowRightIcon size={16} weight="bold" />
              </button>
              <Link
                href={AppRoutes.home}
                className="text-center text-sm font-extrabold text-[#178a45] underline decoration-[#178a45]/40 underline-offset-4"
              >
                Go to Home
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
