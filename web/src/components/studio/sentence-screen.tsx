import { useAppNavigate } from "@/lib/use-app-navigate";
import { useState } from "react";
import { flushSync } from "react-dom";

import { AppRoutes } from "@/lib/app-routes";
import { useSavedSentenceListActions } from "@/lib/query/hooks/saved-sentences";
import { getStep } from "@/lib/studio/content";

import { SpeakerIcon, StarIcon, TurtleIcon } from "./icons";
import { CheckInScene } from "./scenes";
import { speakText } from "./speak";
import { useStudio } from "./studio-provider";
import { BackButton, PrimaryButton } from "./ui";

export function SentenceScreen({
  topicId,
  stepId,
  index,
}: {
  topicId: string;
  stepId: string;
  index: number;
}) {
  const match = getStep(topicId, stepId);
  const navigate = useAppNavigate();
  const studio = useStudio();
  const savedSentences = useSavedSentenceListActions();
  const [rate, setRate] = useState<"slow" | "natural">("natural");

  if (!match) return null;
  const { topic, step } = match;
  const safeIndex = Math.min(Math.max(index, 0), step.sentences.length - 1);
  const sentence = step.sentences[safeIndex];
  const saved = savedSentences.isSaved(sentence.text);

  function goNext() {
    if (safeIndex < step.sentences.length - 1) {
      navigate(`${AppRoutes.learnStep(topic.id, step.id)}?i=${safeIndex + 1}`);
      return;
    }
    flushSync(() => {
      studio.startLessonPractice(sentence.text, sentence.meaning);
    });
    navigate(AppRoutes.practice);
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center gap-3">
          <BackButton href={AppRoutes.learnTopic(topic.id)} label={`Back to ${topic.lesson.title}`} />
          <h1 className="text-lg font-extrabold">{topic.lesson.title}</h1>
        </div>
        <span className="w-fit rounded-full bg-white px-4 py-1.5 text-sm font-extrabold shadow-sm">
          {step.title}
        </span>
        <div className="flex items-center justify-end gap-3">
          <span className="text-sm font-extrabold text-sen-primary">
            {safeIndex + 1} / {step.sentences.length}
          </span>
          <button
            type="button"
            aria-pressed={saved}
            aria-label={saved ? "Remove from saved sentences" : "Save sentence"}
            disabled={!savedSentences.rows || savedSentences.pending}
            onClick={() => savedSentences.toggleText(sentence.text)}
            className={`grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm ${
              saved ? "text-sen-gold" : "text-[#c5d0c8]"
            }`}
          >
            <StarIcon filled={saved} className="h-5 w-5" />
          </button>
        </div>
      </div>
      {savedSentences.listError ?? savedSentences.error ? (
        <p className="rounded-[22px] bg-white px-5 py-4 font-semibold text-sen-heart shadow-sm" role="alert">
          {savedSentences.listError ?? savedSentences.error}
        </p>
      ) : null}

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1.05fr_1fr]">
        <div className="min-h-[280px] overflow-hidden rounded-[28px] shadow-sm">
          <CheckInScene />
        </div>
        <section className="flex flex-col rounded-[28px] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-center gap-4">
            <p className="text-center text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              {sentence.text}
            </p>
            <button
              type="button"
              aria-label="Play sentence"
              onClick={() => speakText(sentence.text, rate === "slow" ? 0.72 : 1)}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sen-primary text-white hover:bg-sen-primary-dark"
            >
              <SpeakerIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mx-auto mt-6 inline-flex rounded-full bg-[#eef3ef] p-1">
            <button
              type="button"
              onClick={() => setRate("slow")}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-extrabold ${
                rate === "slow" ? "bg-sen-primary text-white" : "text-sen-muted"
              }`}
            >
              <TurtleIcon className="h-4 w-4" />
              Slow
            </button>
            <button
              type="button"
              onClick={() => setRate("natural")}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-extrabold ${
                rate === "natural" ? "bg-sen-primary text-white" : "text-sen-muted"
              }`}
            >
              <SpeakerIcon className="h-4 w-4" />
              Natural
            </button>
          </div>

          <div className="mt-6 rounded-2xl bg-[#eef8f0] px-5 py-4">
            <p className="text-sm font-extrabold text-sen-primary">Meaning</p>
            <p className="mt-1 font-semibold text-sen-ink/80">{sentence.meaning}</p>
          </div>

          <div className="mt-auto pt-6">
            <PrimaryButton onClick={goNext} className="w-full">
              Next →
            </PrimaryButton>
          </div>
        </section>
      </div>
    </div>
  );
}
