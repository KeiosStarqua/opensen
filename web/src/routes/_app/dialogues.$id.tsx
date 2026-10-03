import { createFileRoute } from "@tanstack/react-router";

import { DialogueView } from "@/components/dialogues/dialogue-view";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/_app/dialogues/$id")({
  head: () => ({ meta: [pageTitle("Dialogue")] }),
  component: DialoguePage,
});

function DialoguePage() {
  const { id } = Route.useParams();
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <DialogueView dialogueId={id} />
    </div>
  );
}
