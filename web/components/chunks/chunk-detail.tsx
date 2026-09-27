"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  chunksApi,
  createDefaultApiClient,
  formatApiErrorMessage,
} from "@/lib/api";
import { AppRoutes } from "@/lib/app-routes";
import { savePracticeFocusQueue } from "@/lib/practice/focus-queue";
import type { DuePracticeItem } from "@/lib/practice/types";

type ChunkDetail = {
  id: string;
  text: string;
  meaning: string;
  level: string;
  register: string;
  editable: boolean;
  patternId: string | null;
  situation: { id: string; name: string } | null;
};

export function ChunkDetailView({ chunkId }: { chunkId: string }) {
  const client = useMemo(() => createDefaultApiClient(), []);
  const router = useRouter();
  const [data, setData] = useState<ChunkDetail | null>(null);
  const [patternId, setPatternId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editMeaning, setEditMeaning] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const result = await chunksApi.getChunk(client, chunkId);
      if (!active) return;
      if (!result.ok) {
        setError(formatApiErrorMessage(result.error));
        return;
      }
      const detail = result.data as ChunkDetail;
      setData(detail);
      setEditText(detail.text);
      setEditMeaning(detail.meaning);
      setPatternId(detail.patternId);
    })();
    return () => {
      active = false;
    };
  }, [client, chunkId]);

  async function saveEdits() {
    if (!data?.editable) return;
    setSaving(true);
    const result = await chunksApi.updateChunk(client, chunkId, {
      text: editText.trim(),
      meaning: editMeaning.trim(),
    });
    setSaving(false);
    if (!result.ok) {
      setError(formatApiErrorMessage(result.error));
      return;
    }
    setData(result.data as ChunkDetail);
    setError(null);
  }

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
    router.push(AppRoutes.practiceSession);
  }

  if (error && !data) {
    return (
      <p className="text-red-700">
        {error}{" "}
        <Link href={AppRoutes.library} className="underline">
          Library
        </Link>
      </p>
    );
  }

  if (!data) return <p className="text-slate-600">Loading chunk…</p>;

  return (
    <div className="space-y-6">
      <Link href={AppRoutes.library} className="text-sm text-slate-600">
        ← Library
      </Link>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {data.editable ? (
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
            onClick={() => void saveEdits()}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
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
          <Link
            href={AppRoutes.drill(patternId)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium"
          >
            Substitution drill
          </Link>
        ) : null}
      </div>
    </div>
  );
}
