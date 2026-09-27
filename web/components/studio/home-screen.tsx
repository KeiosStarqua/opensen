"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AppRoutes } from "@/lib/app-routes";
import { listLibraryItems, topics } from "@/lib/studio/content";

import {
  ArrowRightIcon,
  BellIcon,
  ChevronRightIcon,
  CoinIcon,
  FlameIcon,
  TopicGlyph,
} from "./icons";
import { AirportScene, HomeLandscape } from "./scenes";
import { useStudio } from "./studio-provider";
import { SearchField, Track } from "./ui";

export function HomeScreen() {
  const studio = useStudio();
  const [query, setQuery] = useState("");
  const [noticeOpen, setNoticeOpen] = useState(false);
  const travel = studio.topicProgress.travel;
  const q = query.trim().toLowerCase();

  const visibleTopics = useMemo(() => {
    if (!q) return topics;
    return topics.filter(
      (topic) =>
        topic.name.toLowerCase().includes(q) ||
        topic.lesson.title.toLowerCase().includes(q) ||
        topic.blurb.toLowerCase().includes(q),
    );
  }, [q]);

  const sentenceHits = useMemo(() => {
    if (!q) return [];
    return listLibraryItems()
      .filter((item) => item.text.toLowerCase().includes(q) || item.meaning.toLowerCase().includes(q))
      .slice(0, 4);
  }, [q]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <SearchField
          value={query}
          onChange={setQuery}
          className="w-full max-w-md"
          label="Search topics and sentences"
        />
        <div className="flex-1" />
        <div className="relative">
          <button
            type="button"
            aria-expanded={noticeOpen}
            aria-label="Notifications"
            onClick={() => setNoticeOpen((open) => !open)}
            className="relative grid h-11 w-11 place-items-center rounded-full bg-white text-sen-ink shadow-sm hover:bg-sen-soft"
          >
            <BellIcon className="h-5 w-5" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-sen-flame" />
          </button>
          {noticeOpen ? (
            <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl bg-white p-4 text-left shadow-xl">
              <p className="font-extrabold">Nice work, {studio.name}</p>
              <p className="mt-1 text-sm font-semibold text-sen-muted">
                You are {travel.done} sentences into At the Airport. The next step is ready.
              </p>
              <Link
                href={AppRoutes.learn}
                className="mt-3 inline-flex text-sm font-extrabold text-sen-primary"
                onClick={() => setNoticeOpen(false)}
              >
                Continue learning
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Hi {studio.name}!</h1>
          <p className="mt-1 font-semibold text-sen-muted">Let&apos;s learn a new sentence today!</p>
        </div>
        <div className="flex gap-2">
          <StatPill
            icon={<FlameIcon className="h-6 w-6 text-sen-flame" />}
            value={String(studio.streak)}
            label="Day streak"
          />
          <StatPill
            icon={<CoinIcon className="h-6 w-6 text-sen-primary" />}
            value={String(studio.points)}
            label="points"
          />
        </div>
      </div>

      <section className="relative">
        <div className="h-[220px] overflow-hidden rounded-[28px] shadow-sm sm:h-[280px] xl:h-[340px]">
          <HomeLandscape />
        </div>
        <article className="relative z-10 mt-4 rounded-[24px] bg-white p-4 shadow-[0_12px_30px_rgba(40,80,50,0.08)] lg:absolute lg:right-5 lg:top-1/2 lg:mt-0 lg:w-[340px] lg:-translate-y-1/2">
          <p className="text-xs font-extrabold uppercase tracking-wide text-sen-muted">Continue learning</p>
          <div className="mt-3 flex gap-3">
            <div className="h-16 w-[88px] shrink-0 overflow-hidden rounded-2xl">
              <AirportScene />
            </div>
            <div className="min-w-0">
              <h2 className="font-extrabold">At the Airport</h2>
              <p className="text-xs font-semibold leading-snug text-sen-muted">
                Ask for help, check in, and more!
              </p>
            </div>
          </div>
          <div className="mt-4 pr-12">
            <p className="mb-1.5 text-xs font-bold text-sen-muted">
              {travel.done} / {travel.total} sentences
            </p>
            <Track value={(travel.done / travel.total) * 100} />
          </div>
          <Link
            href={AppRoutes.learn}
            aria-label="Continue At the Airport"
            className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-sen-primary text-white shadow-md hover:bg-sen-primary-dark"
          >
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </article>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold">Popular topics</h2>
        </div>
        {visibleTopics.length === 0 ? (
          <p className="mt-3 text-sm font-semibold text-sen-muted">No topics match “{query.trim()}”.</p>
        ) : (
          <div className="mt-3 flex items-stretch gap-3">
            <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {visibleTopics.map((topic) => (
                <Link
                  key={topic.id}
                  href={AppRoutes.learnTopic(topic.id)}
                  className="flex flex-col items-center rounded-[22px] bg-white px-3 py-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className={`grid h-14 w-14 place-items-center rounded-2xl ${topic.tileClass}`}>
                    <TopicGlyph name={topic.icon} className="h-7 w-7" />
                  </span>
                  <span className="mt-3 text-sm font-extrabold">{topic.name}</span>
                  <span className="text-xs font-semibold text-sen-muted">
                    {topic.lesson.steps.length} lessons
                  </span>
                </Link>
              ))}
            </div>
            <Link
              href={AppRoutes.explore}
              aria-label="Explore all topics"
              className="grid h-12 w-12 shrink-0 place-items-center self-center rounded-full bg-white text-sen-ink shadow-sm hover:bg-sen-soft"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </Link>
          </div>
        )}
        {sentenceHits.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {sentenceHits.map((item) => (
              <li key={item.id}>
                <Link
                  href={AppRoutes.learnStep(item.topicId, stepIdFor(item.id))}
                  className="block rounded-2xl bg-white px-4 py-3 shadow-sm hover:bg-sen-soft"
                >
                  <span className="font-extrabold">{item.text}</span>
                  <span className="mt-0.5 block text-xs font-semibold text-sen-muted">
                    {item.topicName} · {item.lessonTitle}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

function stepIdFor(sentenceId: string) {
  const item = listLibraryItems().find((entry) => entry.id === sentenceId);
  if (!item) return "check-in";
  const topic = topics.find((entry) => entry.id === item.topicId);
  const match = topic?.lesson.steps.find((lessonStep) =>
    lessonStep.sentences.some((sentence) => sentence.id === sentenceId),
  );
  return match?.id ?? "check-in";
}

function StatPill({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm">
      {icon}
      <div className="leading-tight">
        <p className="text-sm font-extrabold">{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-wide text-sen-muted">{label}</p>
      </div>
    </div>
  );
}
