import { useAppNavigate } from "@/lib/use-app-navigate";
import { PlayIcon } from "@phosphor-icons/react";
import { flushSync } from "react-dom";

import { AppRoutes } from "@/lib/app-routes";
import { queryErrorMessage } from "@/lib/query/api-query";
import { useSavedSentence } from "@/lib/query/hooks/saved-sentences";

import { useStudio } from "../studio/studio-provider";
import { BackButton, PrimaryButton } from "../studio/ui";

export function SavedSentenceStudy({ id }: { id: string }) {
  const sentenceQuery = useSavedSentence(id);
  const sentence = sentenceQuery.data;
  const error = sentence ? null : queryErrorMessage(sentenceQuery.error);
  const studio = useStudio();
  const navigate = useAppNavigate();

  function study(text: string) {
    flushSync(() => {
      studio.startLessonPractice(text, text);
    });
    navigate(AppRoutes.practice);
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
      ) : null}
    </div>
  );
}
