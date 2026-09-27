"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  createDefaultApiClient,
  dialoguesApi,
  formatApiErrorMessage,
} from "@/lib/api";
import { AppRoutes } from "@/lib/app-routes";
import { savePracticeFocusQueue } from "@/lib/practice/focus-queue";
import type { DuePracticeItem } from "@/lib/practice/types";

type Props = {
  situationId: string;
  situationName?: string;
};

export function DialogueBuilder({ situationId, situationName }: Props) {
  const router = useRouter();
  const client = useMemo(() => createDefaultApiClient(), []);
  const [role, setRole] = useState("");
  const [otherSpeaker, setOtherSpeaker] = useState("");
  const [goal, setGoal] = useState("");
  const [tone, setTone] = useState("polite");
  const [level, setLevel] = useState("beginner");
  const [situationText, setSituationText] = useState(
    situationName ?? "Describe the conversation you need",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    dialogue: { title: string; lines: Array<{ speaker: string; text: string; meaningNative?: string }> };
    chunks: Array<{ frame?: string; example?: string; meaningNative: string }>;
    persistence?: { dialogueId: string; chunkIds: string[] };
  } | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (situationText.trim().length < 3) return;
    setLoading(true);
    setError(null);
    const apiResult = await dialoguesApi.generateDialogue(client, {
      situation: situationText.trim(),
      role: role.trim() || undefined,
      otherSpeaker: otherSpeaker.trim() || undefined,
      goal: goal.trim() || undefined,
      tone: tone.trim() || undefined,
      level,
    });
    setLoading(false);
    if (!apiResult.ok) {
      setError(formatApiErrorMessage(apiResult.error));
      return;
    }
    setResult(apiResult.data as typeof result);
  }

  function practiceNow() {
    if (!result?.persistence?.chunkIds.length) {
      setError("Persistence is off or generate did not return chunk ids.");
      return;
    }
    const items: DuePracticeItem[] = result.persistence.chunkIds.map((chunkId, i) => ({
      chunkId,
      text: result.chunks[i]?.example ?? result.chunks[i]?.frame ?? "",
      meaning: result.chunks[i]?.meaningNative ?? "",
      status: "new",
      dueAt: null,
      stability: 0,
      difficulty: 0,
      reps: 0,
      lapses: 0,
    }));
    savePracticeFocusQueue(items);
    router.push(AppRoutes.practiceSession);
  }

  if (result) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">{result.dialogue.title}</h2>
        <ul className="space-y-2 text-sm">
          {result.dialogue.lines.map((line, index) => (
            <li key={index} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <span className="font-medium capitalize">{line.speaker}:</span> {line.text}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3">
          {result.persistence ? (
            <button
              type="button"
              onClick={practiceNow}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
            >
              Practice these chunks
            </button>
          ) : null}
          {result.persistence ? (
            <Link
              href={AppRoutes.dialogue(result.persistence.dialogueId)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium"
            >
              Open saved dialogue
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="space-y-4">
      <Link href={AppRoutes.situation(situationId)} className="text-sm text-slate-600">
        ← Back to situation
      </Link>
      <h1 className="text-2xl font-semibold">Build dialogue</h1>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <label className="block text-sm">
        Situation description
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          rows={3}
          value={situationText}
          onChange={(e) => setSituationText(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Your role
        <input className="mt-1 w-full rounded-lg border px-3 py-2" value={role} onChange={(e) => setRole(e.target.value)} />
      </label>
      <label className="block text-sm">
        Other speaker
        <input className="mt-1 w-full rounded-lg border px-3 py-2" value={otherSpeaker} onChange={(e) => setOtherSpeaker(e.target.value)} />
      </label>
      <label className="block text-sm">
        Goal
        <input className="mt-1 w-full rounded-lg border px-3 py-2" value={goal} onChange={(e) => setGoal(e.target.value)} />
      </label>
      <button
        type="submit"
        disabled={loading || situationText.trim().length < 3}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Generating…" : "Generate dialogue"}
      </button>
    </form>
  );
}
