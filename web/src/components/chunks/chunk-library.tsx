import { AppLink } from "@/components/app-link";
import { useState } from "react";

import { AppRoutes } from "@/lib/app-routes";
import { queryErrorMessage } from "@/lib/query/api-query";
import { useChunks } from "@/lib/query/hooks/chunks";

export function ChunkLibrary() {
  const [q, setQ] = useState("");
  const [register, setRegister] = useState("");
  const chunks = useChunks({
    limit: 100,
    q: q.trim() || undefined,
    register: register || undefined,
  });
  const items = chunks.data ?? [];
  const error = queryErrorMessage(chunks.error);
  const loading = chunks.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Library</h1>
        <AppLink
          href={AppRoutes.newChunk}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
        >
          New chunk
        </AppLink>
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
        <ul
          aria-busy={chunks.isPlaceholderData}
          className={`divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white transition-opacity ${
            chunks.isPlaceholderData ? "opacity-60" : ""
          }`}
        >
          {items.map((chunk) => (
            <li key={chunk.id}>
              <AppLink
                href={AppRoutes.chunk(chunk.id)}
                className="block px-4 py-3 hover:bg-slate-50"
              >
                <p className="font-medium text-slate-900">{chunk.text}</p>
                <p className="text-sm text-slate-600">{chunk.meaning}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                  {chunk.register} · {chunk.level}
                </p>
              </AppLink>
            </li>
          ))}
        </ul>
      )}
      <AppLink href={AppRoutes.export} className="text-sm text-emerald-800 underline">
        Export to Anki
      </AppLink>
    </div>
  );
}
