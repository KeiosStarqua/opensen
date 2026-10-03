import { createFileRoute } from "@tanstack/react-router";

import { LibraryScreen } from "@/components/studio/library-screen";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/_shell/library")({
  head: () => ({ meta: [pageTitle("Library")] }),
  component: LibraryPage,
});

function LibraryPage() {
  return <LibraryScreen />;
}
