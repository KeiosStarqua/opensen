import { createFileRoute } from "@tanstack/react-router";

import { SavedSentenceStudy } from "@/components/saved-sentences/saved-sentence-study";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/_shell/saved/$id")({
  head: () => ({ meta: [pageTitle("Study sentence")] }),
  component: SavedSentencePage,
});

function SavedSentencePage() {
  const { id } = Route.useParams();
  return <SavedSentenceStudy id={id} />;
}
