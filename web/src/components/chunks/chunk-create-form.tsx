import { AppLink } from "@/components/app-link";
import { useAppNavigate } from "@/lib/use-app-navigate";
import { useState } from "react";

import { AppRoutes } from "@/lib/app-routes";
import { queryErrorMessage } from "@/lib/query/api-query";
import { useCreateChunk } from "@/lib/query/hooks/chunks";

export function ChunkCreateForm() {
  const navigate = useAppNavigate();
  const [text, setText] = useState("");
  const [meaning, setMeaning] = useState("");
  const [template, setTemplate] = useState("I'm allergic to {food}");
  const [slotName, setSlotName] = useState("food");
  const [variantText, setVariantText] = useState("peanuts");
  const [variantMeaning, setVariantMeaning] = useState("đậu phộng");
  const createChunk = useCreateChunk();
  const error = queryErrorMessage(createChunk.error);
  const loading = createChunk.isPending;

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;
    const body = {
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
    };
    createChunk.mutate(body, {
      onSuccess: (created) => navigate(AppRoutes.chunk(created.id)),
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <AppLink href={AppRoutes.patterns} className="text-sm text-slate-600">
        ← Sentence patterns
      </AppLink>
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
