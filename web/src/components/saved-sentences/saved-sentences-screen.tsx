import { AppLink } from "@/components/app-link";
import { useEffect, useRef, useState } from "react";
import { PlusIcon, QuotesIcon, StarIcon } from "@phosphor-icons/react";

import { AppRoutes } from "@/lib/app-routes";
import { queryErrorMessage } from "@/lib/query/api-query";
import {
  useSavedSentences,
  useSaveSentence,
  useUnsaveSentences,
} from "@/lib/query/hooks/saved-sentences";

import { PrimaryButton } from "../studio/ui";

export function SavedSentencesScreen({ startComposing = false }: { startComposing?: boolean }) {
  const list = useSavedSentences();
  const save = useSaveSentence();
  const unsave = useUnsaveSentences();
  const [text, setText] = useState("");
  const [composing, setComposing] = useState(startComposing);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const sentences = list.data;
  const listError = sentences ? null : queryErrorMessage(list.error);
  const saveError = queryErrorMessage(save.error);
  const unsaveError = queryErrorMessage(unsave.error);
  const trimmed = text.trim();

  useEffect(() => {
    if (composing) fieldRef.current?.focus();
  }, [composing]);

  function openComposer() {
    setComposing(true);
    fieldRef.current?.focus();
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!trimmed || save.isPending) return;
    save.mutate(trimmed, {
      onSuccess: () => setText(""),
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Sentences you heard</h1>
          <p className="mt-1 max-w-xl font-semibold text-sen-muted">
            Paste a sentence you heard or read. It stays on your account, and you can study it here.
          </p>
        </div>
        <button
          type="button"
          onClick={openComposer}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-sen-primary px-5 text-sm font-extrabold text-white shadow-[0_8px_16px_rgba(31,157,82,0.28)] hover:bg-sen-primary-dark"
        >
          <PlusIcon size={18} weight="regular" />
          Add a sentence
        </button>
      </div>

      {composing ? (
        <form onSubmit={onSubmit} className="rounded-[22px] bg-white p-5 shadow-sm">
          <label className="block text-sm font-extrabold" htmlFor="heard-sentence">
            Sentence
          </label>
          <textarea
            ref={fieldRef}
            id="heard-sentence"
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={500}
            rows={3}
            required
            placeholder="Could you say that again?"
            className="mt-2 w-full resize-y rounded-2xl bg-[#f4f8f5] px-4 py-3 font-semibold text-sen-ink outline-none ring-sen-primary placeholder:text-sen-muted focus:ring-2"
          />
          {saveError ? (
            <p className="mt-2 text-sm font-bold text-sen-heart" role="alert">
              {saveError}
            </p>
          ) : null}
          <PrimaryButton
            type="submit"
            className="mt-4"
            disabled={!trimmed || save.isPending}
          >
            {save.isPending ? "Saving…" : "Save sentence"}
          </PrimaryButton>
        </form>
      ) : null}

      {list.isPending ? (
        <p className="font-semibold text-sen-muted">Loading your sentences…</p>
      ) : null}
      {listError ? (
        <p className="rounded-[22px] bg-white px-5 py-4 font-semibold text-sen-heart shadow-sm" role="alert">
          {listError}
        </p>
      ) : null}
      {sentences && sentences.length === 0 ? (
        <p className="rounded-[22px] bg-white px-5 py-8 text-center font-semibold text-sen-muted shadow-sm">
          Nothing saved yet. Add a sentence you want to say later.
        </p>
      ) : null}
      {unsaveError ? (
        <p className="rounded-[22px] bg-white px-5 py-4 font-semibold text-sen-heart shadow-sm" role="alert">
          {unsaveError}
        </p>
      ) : null}
      {sentences && sentences.length > 0 ? (
        <ul className="space-y-3">
          {sentences.map((sentence) => (
            <li
              key={sentence.id}
              className="flex items-center gap-2 rounded-[22px] bg-white px-3 py-2 shadow-sm"
            >
              <AppLink
                href={AppRoutes.savedSentence(sentence.id)}
                className="flex min-w-0 flex-1 items-start gap-3 rounded-2xl px-2 py-2 hover:bg-sen-soft"
              >
                <QuotesIcon size={22} weight="regular" className="mt-0.5 shrink-0 text-sen-primary" />
                <span className="font-extrabold">{sentence.text}</span>
              </AppLink>
              <button
                type="button"
                aria-pressed
                aria-label={`Unsave ${sentence.text}`}
                disabled={unsave.isPending}
                onClick={() => unsave.mutate([sentence.id])}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sen-gold"
              >
                <StarIcon size={20} weight="fill" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
