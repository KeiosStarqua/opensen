import { createFileRoute } from "@tanstack/react-router";

import { SituationsCatalog } from "@/components/situations/situations-catalog";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/_shell/situations/")({
  head: () => ({ meta: [pageTitle("Situations")] }),
  component: SituationsIndexPage,
});

function SituationsIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Situations</h1>
      <p className="mt-2 text-slate-600">
        Real-world scenarios to anchor your speaking practice.
      </p>
      <div className="mt-8">
        <SituationsCatalog />
      </div>
    </div>
  );
}
