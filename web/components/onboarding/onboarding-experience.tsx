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
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { BrandMark } from "@/components/brand-mark";
import { LeafMascot } from "@/components/onboarding/leaf-mascot";
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

type WizardStep = "goal" | "situation" | "result";

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
  const resultRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<WizardStep>("goal");
  const [selectedLabel, setSelectedLabel] = useState<string>(onboardingGoals[0].label);
  const [situation, setSituation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const goal = goalByLabel(selectedLabel);

  useEffect(() => {
    if (step !== "result") return;
    resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  function selectGoal(label: string) {
    setSelectedLabel(label);
    setResult(null);
    setError(null);
  }

  function goToSituation() {
    setStep("situation");
  }

  function goBackToGoal() {
    setStep("goal");
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
    setStep("result");
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
  const stepIndex = step === "goal" ? 1 : step === "situation" ? 2 : 3;

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-40 h-56 w-56 rounded-full bg-sen-soft/80 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-24 h-48 w-48 rounded-full bg-sen-soft/70 blur-3xl"
      />

      <header className="relative mx-auto flex max-w-3xl items-center justify-between px-5 py-5 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-sen-muted hover:text-sen-ink"
        >
          <ArrowLeftIcon size={16} />
          Back to home
        </Link>
        <p className="flex items-center gap-2 text-sm font-extrabold text-sen-ink">
          <BrandMark className="h-7 w-7" />
          {siteConfig.name}
        </p>
      </header>

      <main className="relative mx-auto max-w-3xl px-5 pb-16 sm:px-8">
        {step !== "result" ? (
          <StepProgress current={stepIndex} total={2} labels={["Situation", "Practice"]} />
        ) : null}

        {step === "goal" ? (
          <GoalStep
            selectedLabel={selectedLabel}
            onSelect={selectGoal}
            onContinue={goToSituation}
          />
        ) : null}

        {step === "situation" ? (
          <SituationStep
            goal={goal}
            situation={situation}
            onSituationChange={setSituation}
            loading={loading}
            error={error}
            onDismissError={() => setError(null)}
            onBack={goBackToGoal}
            onSubmit={handleSubmit}
            canGenerate={canGenerate}
          />
        ) : null}

        {step === "result" && result ? (
          <ResultStep
            ref={resultRef}
            goal={goal}
            result={result}
            onPractice={startPractice}
            onRetry={() => setStep("situation")}
          />
        ) : null}
      </main>
    </div>
  );
}

function StepProgress({
  current,
  total,
  labels,
}: {
  current: number;
  total: number;
  labels: string[];
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2" role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total}>
        {Array.from({ length: total }, (_, index) => {
          const stepNumber = index + 1;
          const state =
            stepNumber < current ? "done" : stepNumber === current ? "active" : "upcoming";
          return (
            <div
              key={stepNumber}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                state === "upcoming" ? "bg-sen-line" : "bg-sen-primary"
              }`}
            />
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between">
        {labels.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === current;
          return (
            <p
              key={label}
              className={`text-[11px] font-extrabold tracking-[0.14em] ${
                isActive ? "text-sen-primary" : "text-sen-muted/70"
              }`}
            >
              {stepNumber}. {label.toUpperCase()}
            </p>
          );
        })}
      </div>
    </div>
  );
}

function GoalStep({
  selectedLabel,
  onSelect,
  onContinue,
}: {
  selectedLabel: string;
  onSelect: (label: string) => void;
  onContinue: () => void;
}) {
  return (
    <div className="animate-[fade-in_0.35s_ease-out]">
      <div className="flex flex-col items-center text-center">
        <Image
          src="/onboarding/onboarding-mascot-wave.png"
          alt="Sen waving hello"
          width={96}
          height={96}
          priority
          className="h-20 w-20 sm:h-24 sm:w-24"
        />
        <h1 className="mt-3 max-w-xl text-3xl font-extrabold leading-[1.12] tracking-tight sm:text-4xl">
          What do you want to speak English for?
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-sen-muted sm:text-base">
          Pick the closest match. OpenSen will shape your first practice set around a
          real conversation you need soon.
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="What you want to speak English for"
        className="mt-8 grid gap-3 sm:grid-cols-2"
      >
        {onboardingGoals.map((option) => (
          <GoalOption
            key={option.id}
            goal={option}
            selected={option.label === selectedLabel}
            onSelect={() => onSelect(option.label)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-sen-primary px-5 py-3.5 text-sm font-extrabold text-white hover:bg-sen-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sen-primary sm:w-auto"
      >
        Continue
        <ArrowRightIcon size={16} weight="bold" />
      </button>
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
      className={`flex items-center gap-3 rounded-[18px] border px-3 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sen-primary ${
        selected
          ? "border-sen-primary/40 bg-sen-soft"
          : "border-sen-line bg-white hover:border-sen-primary/30"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          selected ? "bg-white text-sen-primary" : "bg-sen-soft text-sen-primary-dark"
        }`}
      >
        <GoalIcon size={18} weight={selected ? "fill" : "regular"} />
      </span>
      <span className="min-w-0 flex-1 text-sm font-extrabold text-sen-ink">{goal.label}</span>
      {selected ? (
        <CheckCircleIcon size={22} weight="fill" className="shrink-0 text-sen-primary" />
      ) : (
        <CaretRightIcon size={16} className="shrink-0 text-sen-muted" />
      )}
    </button>
  );
}

function SituationStep({
  goal,
  situation,
  onSituationChange,
  loading,
  error,
  onDismissError,
  onBack,
  onSubmit,
  canGenerate,
}: {
  goal: OnboardingGoal;
  situation: string;
  onSituationChange: (value: string) => void;
  loading: boolean;
  error: string | null;
  onDismissError: () => void;
  onBack: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  canGenerate: boolean;
}) {
  const GoalIcon = goalIcons[goal.id];
  return (
    <div className="mx-auto max-w-xl animate-[fade-in_0.35s_ease-out]">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-sen-muted hover:text-sen-ink"
      >
        <ArrowLeftIcon size={14} />
        Change goal
      </button>

      <div className="rounded-[28px] bg-white p-5 shadow-[0_16px_40px_rgba(23,48,40,0.06)] sm:p-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-sen-soft px-3 py-1 text-xs font-extrabold text-sen-primary-dark">
          <GoalIcon size={14} weight="fill" />
          {goal.label}
        </span>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
          What conversation do you need soon?
        </h2>
        <p className="mt-2 text-sm text-sen-muted">
          Tell OpenSen what you&apos;ll actually need to say. Example: &quot;{goal.example}&quot;
        </p>

        <form onSubmit={onSubmit}>
          <label className="mt-4 block">
            <span className="sr-only">Describe your upcoming conversation</span>
            <textarea
              rows={5}
              maxLength={SITUATION_MAX_LENGTH}
              value={situation}
              onChange={(event) => onSituationChange(event.target.value)}
              placeholder={goal.example}
              autoFocus
              className="w-full resize-none rounded-2xl border border-sen-line bg-[#fbfcfb] px-4 py-3 text-sm leading-6 text-sen-ink placeholder:text-sen-muted/70 focus:border-sen-primary focus:outline-none focus:ring-2 focus:ring-sen-soft"
            />
          </label>
          <p
            className={`text-right text-xs font-bold ${
              situation.length > SITUATION_MAX_LENGTH - 40
                ? "text-[#c47b12]"
                : "text-sen-muted/80"
            }`}
          >
            {situation.length}/{SITUATION_MAX_LENGTH}
          </p>

          <p className="mt-1 rounded-xl bg-sen-soft/60 px-3 py-2 text-xs leading-5 text-sen-muted">
            💡 Example: &quot;{goal.example}&quot;
          </p>

          {error ? (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}{" "}
              <button
                type="button"
                className="font-extrabold underline"
                onClick={onDismissError}
              >
                Dismiss
              </button>
            </p>
          ) : null}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={!canGenerate}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sen-primary px-5 py-3 text-sm font-extrabold text-white hover:bg-sen-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sen-primary disabled:cursor-not-allowed disabled:bg-[#c5d5cb]"
            >
              {loading ? "Generating…" : "Generate my practice set"}
              {loading ? null : <ArrowRightIcon size={16} weight="bold" />}
            </button>
            <Link
              href={AppRoutes.situations}
              className="text-sm font-extrabold text-sen-primary underline decoration-sen-primary/40 underline-offset-4 hover:decoration-sen-primary"
            >
              Browse situations instead
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResultStep({
  ref,
  goal,
  result,
  onPractice,
  onRetry,
}: {
  ref: React.RefObject<HTMLDivElement | null>;
  goal: OnboardingGoal;
  result: GenerateResponse;
  onPractice: () => void;
  onRetry: () => void;
}) {
  const GoalIcon = goalIcons[goal.id];
  const title = result.dialogue.title || goal.previewTitle;
  const lines: OnboardingPreviewLine[] = result.dialogue.lines.map((line) => ({
    speaker: line.speaker === "learner" ? "learner" : "other",
    text: line.text,
  }));
  const meanings = result.dialogue.lines.map((line) => line.meaningNative);
  const chunks = result.chunks.map((chunk) => ({
    text: chunk.example || chunk.frame,
    meaning: chunk.meaningNative,
  }));

  return (
    <div ref={ref} className="scroll-mt-6 animate-[fade-in_0.35s_ease-out]">
      <div className="relative h-48 overflow-hidden rounded-[28px] sm:h-64">
        <img
          src={goal.scene}
          alt={goal.sceneAlt}
          className="h-full w-full object-cover object-[center_78%]"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent p-4 sm:p-5">
          <p className="text-[11px] font-extrabold tracking-[0.16em] text-white/90">
            READY · YOUR PRACTICE SET
          </p>
        </div>
        <div className="absolute left-3 top-3 max-w-[230px] rounded-2xl rounded-bl-md bg-white/95 px-3 py-2.5 shadow-[0_10px_24px_rgba(23,48,40,0.12)]">
          <p className="flex items-start gap-2 text-sm font-extrabold leading-snug text-sen-ink">
            <button
              type="button"
              onClick={() => speak(goal.prompt)}
              aria-label={`Play: ${goal.prompt}`}
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sen-soft text-sen-primary hover:bg-[#d4f0de]"
            >
              <SpeakerHighIcon size={14} weight="fill" />
            </button>
            <span>{goal.prompt}</span>
          </p>
          <p className="mt-1.5 text-[11px] leading-snug text-sen-muted">
            <span className="font-extrabold text-sen-primary">Nghĩa là:</span> {goal.meaning}
          </p>
        </div>
      </div>

      <section className="mt-4 rounded-[28px] bg-sen-soft p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(220px,0.7fr)] lg:items-start">
          <div>
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-sen-primary">
                <GoalIcon size={22} weight="fill" />
              </span>
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">{title}</h2>
                <p className="mt-1 max-w-xl text-sm leading-6 text-sen-muted">
                  Lines and chunks from the conversation you described.
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
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sen-soft">
                      <LeafMascot pose="idle" className="h-7 w-7" />
                    </span>
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d7efe4] text-xs font-extrabold text-sen-primary">
                      A
                    </span>
                  )}
                  <p className="min-w-0 flex-1 pt-1 text-sm font-bold leading-snug text-sen-ink">
                    {line.text}
                    {meanings[index] ? (
                      <span className="mt-0.5 block text-xs font-semibold text-sen-muted">
                        {meanings[index]}
                      </span>
                    ) : null}
                  </p>
                  <button
                    type="button"
                    onClick={() => speak(line.text)}
                    aria-label={`Play: ${line.text}`}
                    className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sen-primary hover:bg-sen-soft"
                  >
                    <SpeakerHighIcon size={18} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-white p-4">
            <h3 className="text-sm font-extrabold text-sen-ink">Chunks to practice</h3>
            <ul className="mt-2">
              {chunks.map((chunk, index) => (
                <li
                  key={`${chunk.text}-${index}`}
                  className="flex items-center gap-3 border-b border-[#eef4f0] py-2.5 last:border-b-0"
                >
                  <p className="min-w-0 flex-1 text-sm font-bold text-sen-ink">
                    {chunk.text}
                    {chunk.meaning ? (
                      <span className="mt-0.5 block text-xs font-semibold text-sen-muted">
                        {chunk.meaning}
                      </span>
                    ) : null}
                  </p>
                  <button
                    type="button"
                    onClick={() => speak(chunk.text)}
                    aria-label={`Play: ${chunk.text}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sen-primary hover:bg-sen-soft"
                  >
                    <SpeakerHighIcon size={18} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={onPractice}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-sen-primary px-4 py-2.5 text-sm font-extrabold text-white hover:bg-sen-primary-dark"
              >
                Practice these chunks
                <ArrowRightIcon size={16} weight="bold" />
              </button>
              <button
                type="button"
                onClick={onRetry}
                className="text-center text-sm font-extrabold text-sen-primary underline decoration-sen-primary/40 underline-offset-4"
              >
                Try a different situation
              </button>
              <Link
                href={AppRoutes.home}
                className="text-center text-sm font-extrabold text-sen-muted underline decoration-sen-muted/30 underline-offset-4"
              >
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
