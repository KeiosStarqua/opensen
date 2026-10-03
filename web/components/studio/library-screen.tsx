"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PlusIcon } from "@phosphor-icons/react";

import { AppRoutes } from "@/lib/app-routes";
import {
  initialSavedIds,
  libraryFilters,
  listLibraryItems,
  type LibraryFilter,
} from "@/lib/studio/content";

import { SpeakerIcon, StarIcon } from "./icons";
import { speakText } from "./speak";
import { useStudio } from "./studio-provider";
import { SearchField } from "./ui";

export function LibraryScreen() {
  const studio = useStudio();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<LibraryFilter>("saved");
  const items = useMemo(() => listLibraryItems(), []);
  const q = query.trim().toLowerCase();

  const visible = items
    .filter((item) => {
      if (filter === "saved") return studio.isSaved(item.id);
      return item.topicId === filter;
    })
    .filter((item) => !q || item.text.toLowerCase().includes(q) || item.meaning.toLowerCase().includes(q))
    .sort((a, b) => {
      if (filter !== "saved") return 0;
      const aIndex = initialSavedIds.indexOf(a.id);
      const bIndex = initialSavedIds.indexOf(b.id);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight">My Sentences</h1>
          <Link
            href={`${AppRoutes.saved}?add=1`}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-sen-primary px-4 text-sm font-extrabold text-white shadow-[0_8px_16px_rgba(31,157,82,0.28)] hover:bg-sen-primary-dark"
          >
            <PlusIcon size={18} weight="regular" />
            Add a sentence
          </Link>
        </div>
        <SearchField
          value={query}
          onChange={setQuery}
          className="w-full max-w-xs"
          label="Search sentences"
        />
      </div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Sentence filters">
        {libraryFilters.map((entry) => {
          const active = filter === entry.id;
          return (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(entry.id)}
              className={`rounded-full px-4 py-2 text-sm font-extrabold ${
                active ? "bg-sen-primary text-white" : "bg-white text-sen-ink shadow-sm hover:bg-sen-soft"
              }`}
            >
              {entry.label}
            </button>
          );
        })}
      </div>
      {visible.length === 0 ? (
        <p className="rounded-[22px] bg-white px-5 py-8 text-center font-semibold text-sen-muted shadow-sm">
          No sentences in this filter yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((item) => {
            const saved = studio.isSaved(item.id);
            return (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-[22px] bg-white px-4 py-3 shadow-sm"
              >
                <button
                  type="button"
                  aria-label={`Play ${item.text}`}
                  onClick={() => speakText(item.text)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sen-soft text-sen-primary hover:bg-sen-primary hover:text-white"
                >
                  <SpeakerIcon className="h-5 w-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold">{item.text}</p>
                  <p className="text-xs font-semibold text-sen-muted">
                    {item.topicName} · {item.lessonTitle}
                  </p>
                </div>
                <button
                  type="button"
                  aria-pressed={saved}
                  aria-label={saved ? "Unsave sentence" : "Save sentence"}
                  onClick={() => studio.toggleSaved(item.id)}
                  className={`grid h-10 w-10 place-items-center rounded-full ${
                    saved ? "text-sen-gold" : "text-[#c5d0c8]"
                  }`}
                >
                  <StarIcon filled={saved} className="h-5 w-5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
