import { AppLink } from "@/components/app-link";
import { DialogueDetailSkeleton } from "@/components/content/content-loading";

import { AppRoutes } from "@/lib/app-routes";
import { queryErrorMessage } from "@/lib/query/api-query";
import { useDialogue } from "@/lib/query/hooks/dialogues";

export function DialogueView({ dialogueId }: { dialogueId: string }) {
  const dialogue = useDialogue(dialogueId);
  const data = dialogue.data;
  const error = data ? null : queryErrorMessage(dialogue.error);

  if (error) {
    return (
      <p className="text-red-700">
        {error}{" "}
        <AppLink href={AppRoutes.situations} className="underline">
          Situations
        </AppLink>
      </p>
    );
  }

  if (!data && !dialogue.isPending) {
    return (
      <p className="text-red-700">
        Dialogue not found{" "}
        <AppLink href={AppRoutes.situations} className="underline">
          Situations
        </AppLink>
      </p>
    );
  }

  if (!data) return <DialogueDetailSkeleton />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">{data.title}</h1>
      <p className="text-sm text-slate-600">Level {data.level}</p>
      <ul className="space-y-2">
        {data.lines.map((line, index) => (
          <li key={index} className="rounded-lg border bg-white px-3 py-2 text-sm">
            <span className="font-medium capitalize">{line.speaker}:</span> {line.text}
          </li>
        ))}
      </ul>
      {data.chunks.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold">Chunks</h2>
          <ul className="mt-2 space-y-2">
            {data.chunks.map((chunk) => (
              <li key={chunk.id} className="text-sm">
                <AppLink href={AppRoutes.chunk(chunk.id)} className="font-medium text-emerald-800">
                  {chunk.text}
                </AppLink>
                <p className="text-slate-600">{chunk.meaning}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
