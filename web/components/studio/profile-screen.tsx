"use client";

import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { useMemo, useState } from "react";

import { AppRoutes } from "@/lib/app-routes";
import { authClient } from "@/lib/auth/client";
import { topics } from "@/lib/studio/content";

import { CoinIcon, FlameIcon, SentencesIcon, SettingsIcon, TopicGlyph } from "./icons";
import { useStudio } from "./studio-provider";
import { SearchField } from "./ui";

export function ProfileScreen() {
  const studio = useStudio();
  const { data: session } = authClient.useSession();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const rows = useMemo(
    () => topics.filter((topic) => !q || topic.name.toLowerCase().includes(q)),
    [q],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight">My Progress</h1>
        <div className="flex items-center gap-2">
          <SearchField value={query} onChange={setQuery} className="w-full max-w-xs" label="Search topics" />
          <SignOutButton />
          <Link
            href={AppRoutes.account}
            className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-sen-ink shadow-sm hover:bg-sen-soft"
          >
            Account
          </Link>
          <Link
            href={AppRoutes.settings}
            aria-label="Settings"
            className="grid h-11 w-11 place-items-center rounded-full bg-white text-sen-ink shadow-sm hover:bg-sen-soft"
          >
            <SettingsIcon className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {session?.user ? (
        <p className="text-sm font-semibold text-sen-muted">
          Signed in as {session.user.email}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          icon={<FlameIcon className="h-6 w-6 text-sen-flame" />}
          value={String(studio.streak)}
          label="Day streak"
        />
        <Stat
          icon={<CoinIcon className="h-6 w-6 text-sen-primary" />}
          value={String(studio.points)}
          label="points"
        />
        <Stat
          icon={<SentencesIcon className="h-6 w-6 text-[#3d93e8]" />}
          value={String(studio.sentencesLearned)}
          label="sentences"
        />
      </div>

      <section className="rounded-[28px] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-extrabold">Topics</h2>
        {rows.length === 0 ? (
          <p className="mt-4 text-sm font-semibold text-sen-muted">No topics match “{query.trim()}”.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {rows.map((topic) => {
              const progress = studio.topicProgress[topic.id] ?? { done: 0, total: 1 };
              const width = `${Math.min(100, (progress.done / progress.total) * 100)}%`;
              return (
                <li key={topic.id}>
                  <Link href={AppRoutes.learnTopic(topic.id)} className="flex items-center gap-3">
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${topic.tileClass}`}>
                      <TopicGlyph name={topic.icon} className="h-6 w-6" />
                    </span>
                    <span className="w-28 shrink-0 font-extrabold">{topic.name}</span>
                    <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#e7efe8]">
                      <span className={`block h-full rounded-full ${topic.barClass}`} style={{ width }} />
                    </span>
                    <span className="w-12 text-right text-sm font-extrabold text-sen-muted">
                      {progress.done}/{progress.total}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <article className="flex items-center gap-3 rounded-[22px] bg-white px-4 py-4 shadow-sm">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f6faf7]">{icon}</span>
      <div>
        <p className="text-2xl font-extrabold leading-none">{value}</p>
        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-sen-muted">{label}</p>
      </div>
    </article>
  );
}
