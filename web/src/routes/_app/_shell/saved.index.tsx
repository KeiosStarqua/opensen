import { createFileRoute } from "@tanstack/react-router";

import { SavedSentencesScreen } from "@/components/saved-sentences/saved-sentences-screen";
import { pageTitle } from "@/lib/page-title";
import { optionalString } from "@/lib/routing/search";

export const Route = createFileRoute("/_app/_shell/saved/")({
  validateSearch: (search: Record<string, unknown>) => ({
    add: optionalString(search.add),
  }),
  head: () => ({ meta: [pageTitle("Sentences you heard")] }),
  component: SavedSentencesPage,
});

function SavedSentencesPage() {
  const { add } = Route.useSearch();
  return <SavedSentencesScreen startComposing={add === "1"} />;
}
