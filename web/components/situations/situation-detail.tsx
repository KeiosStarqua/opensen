"use client";

import Link from "next/link";

import { AppRoutes } from "@/lib/app-routes";
import { queryErrorMessage } from "@/lib/query/api-query";
import { useSituation } from "@/lib/query/hooks/situations";

export function SituationDetail({ situationId }: { situationId: string }) {
  const { data: detail, error: queryError, isPending: loading } =
    useSituation(situationId);
  const error = queryErrorMessage(queryError);

  if (loading) {
    return <p className="text-slate-600">Loading…</p>;
  }

  if (error || !detail) {
    return (
      <div className="space-y-4">
        <p className="text-red-700">{error ?? "Situation not found"}</p>
        <Link href={AppRoutes.situations} className="text-sm font-medium text-emerald-800">
          ← Back to catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={AppRoutes.situations}
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Situations
        </Link>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-emerald-800">
          {detail.category}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{detail.name}</h1>
        <p className="mt-4 text-lg text-slate-600">{detail.description}</p>
        <p className="mt-4 text-sm text-slate-600">
          You: {detail.roleSelf} · Other: {detail.roleOther} · Tone: {detail.tone}
        </p>
        <p className="mt-2 text-sm text-slate-600">Goal: {detail.goal}</p>
        <Link
          href={AppRoutes.buildDialogue(detail.id)}
          className="mt-6 inline-block rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
        >
          Build dialogue
        </Link>
      </div>

      {detail.intents.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold">Intents</h2>
          <ul className="mt-3 space-y-2">
            {detail.intents.map((intent) => (
              <li key={intent.id} className="text-sm text-slate-700">
                <span className="font-medium">{intent.name}</span> —{" "}
                {intent.description}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {detail.dialogues.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold">Template dialogues</h2>
          <ul className="mt-3 space-y-2">
            {detail.dialogues.map((dialogue) => (
              <li key={dialogue.id}>
                <Link
                  href={AppRoutes.dialogue(dialogue.id)}
                  className="text-sm font-medium text-emerald-800 hover:underline"
                >
                  {dialogue.title} ({dialogue.level})
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {detail.chunks.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold">Chunks</h2>
          <ul className="mt-3 space-y-3">
            {detail.chunks.slice(0, 12).map((chunk) => (
              <li key={chunk.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                <p className="font-medium">{chunk.text}</p>
                <p className="text-slate-600">{chunk.meaning}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
