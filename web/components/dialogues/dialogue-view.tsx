"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  createDefaultApiClient,
  dialoguesApi,
  formatApiErrorMessage,
} from "@/lib/api";
import { AppRoutes } from "@/lib/app-routes";

export function DialogueView({ dialogueId }: { dialogueId: string }) {
  const client = useMemo(() => createDefaultApiClient(), []);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    title: string;
    level: string;
    lines: Array<{ speaker: string; text: string }>;
    chunks: Array<{ id: string; text: string; meaning: string }>;
  } | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const result = await dialoguesApi.getDialogue(client, dialogueId);
      if (!active) return;
      if (!result.ok) {
        setError(formatApiErrorMessage(result.error));
        return;
      }
      setData(result.data as typeof data);
    })();
    return () => {
      active = false;
    };
  }, [client, dialogueId]);

  if (error) {
    return (
      <p className="text-red-700">
        {error}{" "}
        <Link href={AppRoutes.situations} className="underline">
          Situations
        </Link>
      </p>
    );
  }

  if (!data) return <p className="text-slate-600">Loading dialogue…</p>;

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
                <Link href={AppRoutes.chunk(chunk.id)} className="font-medium text-emerald-800">
                  {chunk.text}
                </Link>
                <p className="text-slate-600">{chunk.meaning}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
