import { useAppNavigate } from "@/lib/use-app-navigate";
import { PlayIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { flushSync } from "react-dom";

import { AppRoutes } from "@/lib/app-routes";
import { queryErrorMessage } from "@/lib/query/api-query";
import {
  useSavedSentence,
  useUpdateSavedSentence,
} from "@/lib/query/hooks/saved-sentences";

import { useStudio } from "../studio/studio-provider";
import { BackButton, PrimaryButton } from "../studio/ui";

export function SavedSentenceStudy({ id }: { id: string }) {
  const sentenceQuery = useSavedSentence(id);
  const update = useUpdateSavedSentence(id);
  const sentence = sentenceQuery.data;
  const error = sentence ? null : queryErrorMessage(sentenceQuery.error);
  const saveError = queryErrorMessage(update.error);
  const studio = useStudio();
  const navigate = useAppNavigate();
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? sentence?.text ?? "";
  const trimmed = value.trim();

  function study(text: string) {
    flushSync(() => {
      studio.startLessonPractice(text, text);
    });
    navigate(AppRoutes.practice);
  }

  function onSave(event: React.FormEvent) {
    event.preventDefault();
    if (!trimmed || update.isPending) return;
    update.mutate(trimmed, {
      onSuccess: () => setDraft(null),
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <BackButton href={AppRoutes.saved} label="Back to saved sentences" />
        <h1 className="text-lg font-extrabold">Study this sentence</h1>
      </div>
      {sentenceQuery.isPending ? (
        <p className="font-semibold text-sen-muted">Loading sentence…</p>
      ) : null}
      {error ? (
        <p className="rounded-[22px] bg-white px-5 py-4 font-semibold text-sen-heart shadow-sm" role="alert">
          {error}
        </p>
      ) : null}
      {sentence ? (
        <>
          <section className="rounded-[28px] bg-white p-6 shadow-sm sm:p-8">
            <p className="text-3xl font-extrabold leading-tight tracking-tight">{sentence.text}</p>
            <p className="mt-3 font-semibold text-sen-muted">
              Put the words in order, then say the sentence.
            </p>
            <PrimaryButton className="mt-6 gap-2" onClick={() => study(sentence.text)}>
              <PlayIcon size={18} weight="regular" />
              Study
            </PrimaryButton>
          </section>
          <form onSubmit={onSave} className="rounded-[22px] bg-white p-5 shadow-sm">
            <label className="block text-sm font-extrabold" htmlFor="edit-heard-sentence">
              Edit sentence
            </label>
            <textarea
              id="edit-heard-sentence"
              value={value}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={500}
              rows={3}
              required
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
              disabled={!trimmed || update.isPending}
            >
              {update.isPending ? "Saving…" : "Save changes"}
            </PrimaryButton>
          </form>
        </>
      ) : null}
    </div>
  );
}
