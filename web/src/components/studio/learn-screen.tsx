import { AppLink } from "@/components/app-link";

import { AppRoutes } from "@/lib/app-routes";
import { getTopic } from "@/lib/studio/content";

import { PlaneIcon } from "./icons";
import { StepArt, TopicBanner } from "./scenes";
import { useStudio } from "./studio-provider";
import { BackButton, Stars } from "./ui";

export function LearnScreen({ topicId }: { topicId: string }) {
  const topic = getTopic(topicId);
  const studio = useStudio();
  if (!topic) return null;

  const progress = studio.topicProgress[topic.id] ?? { done: 0, total: topic.lesson.steps.length };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <BackButton href={AppRoutes.home} label="Back to home" />
        <div className="relative min-w-0 flex-1 overflow-hidden rounded-[28px] shadow-sm">
          <div className="h-[220px] sm:h-[300px] xl:h-[360px]">
            <TopicBanner topicId={topic.id} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />
          <div className="absolute left-6 top-6 right-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-[#16324a] drop-shadow-sm">
                {topic.lesson.title}
              </h1>
              <p className="mt-1 font-bold text-[#1d3b52]/80">{topic.lesson.subtitle}</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-sm">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-sen-muted">Your progress</p>
                <p className="font-extrabold">
                  {progress.done} / {progress.total} sentences
                </p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-sen-soft text-sen-primary">
                <PlaneIcon className="h-5 w-5" />
              </span>
            </div>
          </div>
          <div className="absolute inset-x-4 bottom-4">
          <span className="pointer-events-none absolute left-[6%] right-[6%] top-5 h-1 rounded-full bg-white/80" />
          <ol
            className="relative grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${topic.lesson.steps.length}, minmax(0, 1fr))`,
            }}
          >
            {topic.lesson.steps.map((lessonStep, index) => {
              const current = lessonStep.id === topic.lesson.highlightStepId;
              return (
                <li key={lessonStep.id} className="relative z-10 flex flex-col items-center">
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-full text-sm font-extrabold text-white shadow ${
                      index === 0 ? "bg-sen-gold" : "bg-sen-primary"
                    } ${current ? "ring-4 ring-white" : ""}`}
                  >
                    {index + 1}
                  </span>
                  <span className="mt-1.5 text-center text-xs font-extrabold text-white drop-shadow">
                    {lessonStep.title}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {topic.lesson.steps.map((lessonStep, index) => {
          const current = lessonStep.id === topic.lesson.highlightStepId;
          return (
            <AppLink
              key={lessonStep.id}
              href={AppRoutes.learnStep(topic.id, lessonStep.id)}
              className={`rounded-[22px] bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                current ? "ring-2 ring-sen-primary" : ""
              }`}
            >
              <div className="relative h-[74px] overflow-hidden rounded-2xl">
                <StepArt art={lessonStep.art} />
                <span className="absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-white text-xs font-extrabold text-sen-primary shadow">
                  {index + 1}
                </span>
              </div>
              <h2 className="mt-3 font-extrabold leading-tight">{lessonStep.title}</h2>
              <p className="text-xs font-semibold text-sen-muted">
                {lessonStep.sentences.length} sentences
              </p>
              <div className="mt-2">
                <Stars />
              </div>
            </AppLink>
          );
        })}
      </div>
    </div>
  );
}
