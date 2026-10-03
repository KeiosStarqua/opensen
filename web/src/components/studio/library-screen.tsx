import { AppLink } from "@/components/app-link";
import {
  LibrarySentenceRowsSkeleton,
  SaveStarSkeleton,
} from "@/components/shell/shell-loading";
import { useMemo, useState } from "react";
import { PlusIcon } from "@phosphor-icons/react";

import { AppRoutes } from "@/lib/app-routes";
import { useSavedSentenceListActions } from "@/lib/query/hooks/saved-sentences";
import { librarySavedEntries } from "@/lib/saved-sentences/library-list";
import {
  libraryFilters,
  listLibraryItems,
  type LibraryFilter,
  type LibraryItem,
} from "@/lib/studio/content";

import { SpeakerIcon, StarIcon } from "./icons";
import { speakText } from "./speak";
import { SearchField } from "./ui";

export function LibraryScreen() {
  const saved = useSavedSentenceListActions();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<LibraryFilter>("saved");
  const items = useMemo(() => listLibraryItems(), []);
  const q = query.trim().toLowerCase();
  const rows = saved.rows;
  const savedEntries = useMemo(
    () => librarySavedEntries(rows ?? [], items),
    [rows, items],
  );
  const listError = saved.listError;

  const visibleCatalog = items.filter((item) => {
    if (item.topicId !== filter) return false;
    return matchesQuery(q, item.text, item.meaning);
  });

  const visibleSaved = savedEntries.filter((entry) =>
    matchesQuery(q, entry.text, entry.meaning ?? ""),
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight">My Sentences</h1>
          <AppLink
            href={`${AppRoutes.saved}?add=1`}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-sen-primary px-4 text-sm font-extrabold text-white shadow-[0_8px_16px_rgba(31,157,82,0.28)] hover:bg-sen-primary-dark"
          >
            <PlusIcon size={18} weight="regular" />
            Add a sentence
          </AppLink>
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
      {saved.error ? (
        <p className="rounded-[22px] bg-white px-5 py-4 font-semibold text-sen-heart shadow-sm" role="alert">
          {saved.error}
        </p>
      ) : null}
      {filter !== "saved" && listError ? (
        <p className="rounded-[22px] bg-white px-5 py-4 font-semibold text-sen-heart shadow-sm" role="alert">
          {listError}
        </p>
      ) : null}
      {filter === "saved" ? (
        <SavedList
          pending={saved.list.isPending && !rows && !listError}
          error={listError}
          entries={visibleSaved}
          disabled={saved.pending}
          onUnsave={saved.unsaveId}
        />
      ) : (
        <CatalogList
          items={visibleCatalog}
          isSaved={(text) => saved.isSaved(text)}
          savePending={saved.list.isPending && !rows && !listError}
          disabled={!rows || saved.pending}
          onToggle={saved.toggleText}
        />
      )}
    </div>
  );
}

function matchesQuery(query: string, text: string, meaning: string) {
  if (!query) return true;
  return text.toLowerCase().includes(query) || meaning.toLowerCase().includes(query);
}

function SavedList({
  pending,
  error,
  entries,
  disabled,
  onUnsave,
}: {
  pending: boolean;
  error: string | null;
  entries: ReturnType<typeof librarySavedEntries>;
  disabled: boolean;
  onUnsave: (id: string) => void;
}) {
  if (error) {
    return (
      <p className="rounded-[22px] bg-white px-5 py-4 font-semibold text-sen-heart shadow-sm" role="alert">
        {error}
      </p>
    );
  }
  if (pending) {
    return <LibrarySentenceRowsSkeleton />;
  }
  if (entries.length === 0) {
    return (
      <p className="rounded-[22px] bg-white px-5 py-8 text-center font-semibold text-sen-muted shadow-sm">
        No sentences in this filter yet.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {entries.map((entry) => (
        <LibrarySentenceRow
          key={entry.id}
          text={entry.text}
          subtitle={
            entry.topicName && entry.lessonTitle
              ? `${entry.topicName} · ${entry.lessonTitle}`
              : "Sentence you heard"
          }
          saved
          disabled={disabled}
          href={AppRoutes.savedSentence(entry.id)}
          onToggle={() => onUnsave(entry.id)}
        />
      ))}
    </ul>
  );
}

function CatalogList({
  items,
  isSaved,
  savePending,
  disabled,
  onToggle,
}: {
  items: LibraryItem[];
  isSaved: (text: string) => boolean;
  savePending: boolean;
  disabled: boolean;
  onToggle: (text: string) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-[22px] bg-white px-5 py-8 text-center font-semibold text-sen-muted shadow-sm">
        No sentences in this filter yet.
      </p>
    );
  }
  return (
    <>
      {savePending ? (
        <p className="sr-only" role="status">
          Loading which sentences are saved
        </p>
      ) : null}
      <ul className="space-y-3">
        {items.map((item) => {
          const saved = isSaved(item.text);
          return (
            <LibrarySentenceRow
              key={item.id}
              text={item.text}
              subtitle={`${item.topicName} · ${item.lessonTitle}`}
              saved={saved}
              savePending={savePending}
              disabled={disabled}
              onToggle={() => onToggle(item.text)}
            />
          );
        })}
      </ul>
    </>
  );
}

function LibrarySentenceRow({
  text,
  subtitle,
  saved,
  savePending = false,
  disabled,
  onToggle,
  href,
}: {
  text: string;
  subtitle: string;
  saved: boolean;
  savePending?: boolean;
  disabled: boolean;
  onToggle: () => void;
  href?: string;
}) {
  return (
    <li className="flex items-center gap-3 rounded-[22px] bg-white px-4 py-3 shadow-sm">
      <button
        type="button"
        aria-label={`Play ${text}`}
        onClick={() => speakText(text)}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sen-soft text-sen-primary hover:bg-sen-primary hover:text-white"
      >
        <SpeakerIcon className="h-5 w-5" />
      </button>
      <div className="min-w-0 flex-1">
        {href ? (
          <AppLink href={href} className="font-extrabold hover:text-sen-primary">
            {text}
          </AppLink>
        ) : (
          <p className="font-extrabold">{text}</p>
        )}
        <p className="text-xs font-semibold text-sen-muted">{subtitle}</p>
      </div>
      {savePending ? (
        <SaveStarSkeleton announce={false} />
      ) : (
        <button
          type="button"
          aria-pressed={saved}
          aria-label={saved ? "Unsave sentence" : "Save sentence"}
          disabled={disabled}
          onClick={onToggle}
          className={`grid h-10 w-10 place-items-center rounded-full ${
            saved ? "text-sen-gold" : "text-[#c5d0c8]"
          }`}
        >
          <StarIcon filled={saved} className="h-5 w-5" />
        </button>
      )}
    </li>
  );
}
