import { createFileRoute, notFound } from "@tanstack/react-router";

import { SentenceScreen } from "@/components/studio/sentence-screen";
import { pageTitle } from "@/lib/page-title";
import { optionalString } from "@/lib/routing/search";
import { getStep } from "@/lib/studio/content";

export const Route = createFileRoute("/_app/_shell/learn/$topic/$step")({
  validateSearch: (search: Record<string, unknown>) => ({ i: optionalString(search.i) }),
  loader: ({ params }) => {
    const match = getStep(params.topic, params.step);
    if (!match) throw notFound();
    return { title: `${match.step.title} · ${match.topic.lesson.title}` };
  },
  head: ({ loaderData }) => ({ meta: [pageTitle(loaderData?.title ?? "Sentence")] }),
  component: SentencePage,
});

function SentencePage() {
  const { topic, step } = Route.useParams();
  const { i } = Route.useSearch();
  const index = Number.parseInt(i ?? "0", 10);
  return (
    <SentenceScreen
      topicId={topic}
      stepId={step}
      index={Number.isFinite(index) ? index : 0}
    />
  );
}
