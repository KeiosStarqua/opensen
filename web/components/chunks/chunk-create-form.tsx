"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  chunksApi,
  createDefaultApiClient,
  formatApiErrorMessage,
} from "@/lib/api";
import { AppRoutes } from "@/lib/app-routes";

export function ChunkCreateForm() {
  const client = useMemo(() => createDefaultApiClient(), []);
  const router = useRouter();
  const [text, setText] = useState("");
  const [meaning, setMeaning] = useState("");
  const [template, setTemplate] = useState("I'm allergic to {food}");
  const [slotName, setSlotName] = useState("food");
  const [variantText, setVariantText] = useState("peanuts");
  const [variantMeaning, setVariantMeaning] = useState("đậu phộng");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const result = await chunksApi.createChunk(client, {
      text: text.trim(),
      meaning: meaning.trim(),
      register: "neutral",
      level: "beginner",
      template: template.trim(),
      patternMeaning: meaning.trim(),
      slots: [
        {
          name: slotName.trim(),
          position: 0,
          expectedPos: "noun",
          variants: [{ text: variantText.trim(), meaning: variantMeaning.trim() }],
        },
      ],
    });
    setLoading(false);
    if (!result.ok) {
      setError(formatApiErrorMessage(result.error));
      return;
    }
    const created = result.data as { id: string };
    router.push(AppRoutes.chunk(created.id));
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="space-y-4">
      <Link href={AppRoutes.patterns} className="text-sm text-slate-600">
        ← Sentence patterns
      </Link>
      <h1 className="text-2xl font-semibold">New chunk</h1>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <label className="block text-sm">
        Example sentence
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
      </label>
      <label className="block text-sm">
        Meaning (native)
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          required
        />
      </label>
      <label className="block text-sm">
        Frame template
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          required
        />
      </label>
      <label className="block text-sm">
        Slot name
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={slotName}
          onChange={(e) => setSlotName(e.target.value)}
          required
        />
      </label>
      <label className="block text-sm">
        Slot variant (English)
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={variantText}
          onChange={(e) => setVariantText(e.target.value)}
          required
        />
      </label>
      <label className="block text-sm">
        Slot variant meaning
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={variantMeaning}
          onChange={(e) => setVariantMeaning(e.target.value)}
          required
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create chunk"}
      </button>
    </form>
  );
}
