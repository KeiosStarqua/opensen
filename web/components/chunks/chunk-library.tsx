"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  chunksApi,
  createDefaultApiClient,
  formatApiErrorMessage,
} from "@/lib/api";
import { AppRoutes } from "@/lib/app-routes";

type ChunkItem = {
  id: string;
  text: string;
  meaning: string;
  register: string;
  level: string;
};

export function ChunkLibrary() {
  const client = useMemo(() => createDefaultApiClient(), []);
  const [items, setItems] = useState<ChunkItem[]>([]);
  const [q, setQ] = useState("");
  const [register, setRegister] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      const result = await chunksApi.listChunks(client, {
        limit: 100,
        q: q.trim() || undefined,
        register: register || undefined,
      });
      if (!active) return;
      setLoading(false);
      if (!result.ok) {
        setError(formatApiErrorMessage(result.error));
        return;
      }
      setError(null);
      const data = result.data as { items: ChunkItem[] };
      setItems(data.items ?? []);
    })();
    return () => {
      active = false;
    };
  }, [client, q, register]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Library</h1>
        <Link
          href={AppRoutes.newChunk}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
        >
          New chunk
        </Link>
      </div>
      <div className="flex flex-wrap gap-3">
        <input
          className="min-w-[12rem] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Search chunks"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={register}
          onChange={(e) => setRegister(e.target.value)}
        >
          <option value="">All registers</option>
          <option value="casual">Casual</option>
          <option value="neutral">Neutral</option>
          <option value="polite">Polite</option>
          <option value="formal">Formal</option>
        </select>
      </div>
      {error ? (
        <p className="text-sm text-red-700">{error}</p>
      ) : loading ? (
        <p className="text-slate-600">Loading chunks…</p>
      ) : items.length === 0 ? (
        <p className="text-slate-600">
          No chunks yet. Generate a dialogue or create a custom chunk.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {items.map((chunk) => (
            <li key={chunk.id}>
              <Link
                href={AppRoutes.chunk(chunk.id)}
                className="block px-4 py-3 hover:bg-slate-50"
              >
                <p className="font-medium text-slate-900">{chunk.text}</p>
                <p className="text-sm text-slate-600">{chunk.meaning}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                  {chunk.register} · {chunk.level}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href={AppRoutes.export} className="text-sm text-emerald-800 underline">
        Export to Anki
      </Link>
    </div>
  );
}
