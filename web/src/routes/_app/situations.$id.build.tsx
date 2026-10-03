import { createFileRoute } from "@tanstack/react-router";

import { DialogueBuilder } from "@/components/dialogues/dialogue-builder";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/situations/$id/build")({
  head: () => ({ meta: [pageTitle("Build dialogue")] }),
  component: BuildDialoguePage,
});

function BuildDialoguePage() {
  const { id } = Route.useParams();
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <DialogueBuilder situationId={id} />
    </div>
  );
}
