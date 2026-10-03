import { AppLink } from "@/components/app-link";
import { useAppNavigate } from "@/lib/use-app-navigate";
import { useState } from "react";

import { AppRoutes } from "@/lib/app-routes";
import { savePracticeFocusQueue } from "@/lib/practice/focus-queue";
import type { DuePracticeItem } from "@/lib/practice/types";
import { queryErrorMessage } from "@/lib/query/api-query";
import {
  useChunk,
  useUpdateChunk,
  type ChunkDetail,
} from "@/lib/query/hooks/chunks";

export function ChunkDetailView({ chunkId }: { chunkId: string }) {
  const navigate = useAppNavigate();
  const chunk = useChunk(chunkId);
  const update = useUpdateChunk(chunkId);
  const data = chunk.data;
  const patternId = data?.patternId ?? null;
  const loadError = queryErrorMessage(chunk.error);
  const saveError = queryErrorMessage(update.error);

  function practiceChunk() {
    if (!data) return;
    const item: DuePracticeItem = {
      chunkId: data.id,
      text: data.text,
      meaning: data.meaning,
      status: "new",
      dueAt: null,
      stability: 0,
      difficulty: 0,
      reps: 0,
      lapses: 0,
    };
    savePracticeFocusQueue([item]);
    navigate(AppRoutes.practiceSession);
  }

  if (loadError && !data) {
    return (
      <p className="text-red-700">
        {loadError}{" "}
        <AppLink href={AppRoutes.patterns} className="underline">
          Sentence patterns
        </AppLink>
      </p>
    );
  }

  if (!data) return <p className="text-slate-600">Loading chunk…</p>;

  return (
    <div className="space-y-6">
      <AppLink href={AppRoutes.patterns} className="text-sm text-slate-600">
        ← Sentence patterns
      </AppLink>
      {saveError ? <p className="text-sm text-red-700">{saveError}</p> : null}
      {data.editable ? (
        <ChunkEditor
          key={data.id}
          chunk={data}
          saving={update.isPending}
          onSave={(edits) => update.mutate(edits)}
        />
      ) : (
        <>
          <h1 className="text-3xl font-semibold">{data.text}</h1>
          <p className="text-lg text-slate-700">{data.meaning}</p>
        </>
      )}
      <p className="text-sm text-slate-600">
        {data.register} · {data.level}
        {data.situation ? ` · ${data.situation.name}` : null}
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={practiceChunk}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
        >
          Practice
        </button>
        {patternId ? (
          <AppLink
            href={AppRoutes.drill(patternId)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium"
          >
            Substitution drill
          </AppLink>
        ) : null}
      </div>
    </div>
  );
}

function ChunkEditor({
  chunk,
  saving,
  onSave,
}: {
  chunk: ChunkDetail;
  saving: boolean;
  onSave: (edits: { text: string; meaning: string }) => void;
}) {
  const [editText, setEditText] = useState(chunk.text);
  const [editMeaning, setEditMeaning] = useState(chunk.meaning);

  return (
    <div className="space-y-3">
      <label className="block text-sm">
        Text
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Meaning
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={editMeaning}
          onChange={(e) => setEditMeaning(e.target.value)}
        />
      </label>
      <button
        type="button"
        disabled={saving}
        onClick={() =>
          onSave({ text: editText.trim(), meaning: editMeaning.trim() })
        }
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}
