import { AppLink } from "@/components/app-link";

import { AppRoutes } from "@/lib/app-routes";
import { topics } from "@/lib/studio/content";

import { TopicGlyph } from "./icons";
import { AirportScene } from "./scenes";
import { useStudio } from "./studio-provider";
import { Track } from "./ui";

const moreTools = [
  {
    href: AppRoutes.saved,
    title: "Sentences you heard",
    detail: "Save a sentence from outside the app and study it.",
  },
  { href: AppRoutes.today, title: "Due review", detail: "Sentences that are ready to recall." },
  { href: AppRoutes.plan, title: "Practice plan", detail: "What is due now and this week." },
  { href: AppRoutes.situations, title: "Situations", detail: "Build a dialogue from a real situation." },
  { href: AppRoutes.patterns, title: "Sentence patterns", detail: "Your saved chunks and slots." },
];

export function ExploreScreen() {
  const travel = useStudio().topicProgress.travel;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Explore</h1>
        <p className="mt-1 font-semibold text-sen-muted">
          Pick a situation and learn the sentences you will actually say.
        </p>
      </div>

      <AppLink
        href={AppRoutes.learn}
        className="relative block h-48 overflow-hidden rounded-[28px] shadow-sm"
      >
        <AirportScene />
        <span className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/20 to-transparent" />
        <span className="absolute left-6 top-6">
          <span className="text-sm font-extrabold text-sen-primary">Continue</span>
          <span className="mt-1 block text-3xl font-extrabold text-[#16324a]">At the Airport</span>
          <span className="mt-2 block w-40">
            <Track value={(travel.done / travel.total) * 100} />
          </span>
        </span>
      </AppLink>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {topics.map((topic) => (
          <AppLink
            key={topic.id}
            href={AppRoutes.learnTopic(topic.id)}
            className="rounded-[22px] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className={`grid h-12 w-12 place-items-center rounded-2xl ${topic.tileClass}`}>
              <TopicGlyph name={topic.icon} className="h-6 w-6" />
            </span>
            <h2 className="mt-3 font-extrabold">{topic.name}</h2>
            <p className="mt-1 text-sm font-semibold text-sen-muted">{topic.blurb}</p>
            <p className="mt-3 text-xs font-extrabold text-sen-primary">
              {topic.lesson.steps.length} lessons
            </p>
          </AppLink>
        ))}
      </div>

      <section>
        <h2 className="text-lg font-extrabold">More tools</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {moreTools.map((tool) => (
            <AppLink
              key={tool.href}
              href={tool.href}
              className="rounded-[22px] bg-white px-4 py-4 shadow-sm hover:bg-sen-soft"
            >
              <p className="font-extrabold">{tool.title}</p>
              <p className="mt-1 text-sm font-semibold text-sen-muted">{tool.detail}</p>
            </AppLink>
          ))}
        </div>
      </section>
    </div>
  );
}
