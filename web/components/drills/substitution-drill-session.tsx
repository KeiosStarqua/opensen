"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  chunksApi,
  createDefaultApiClient,
  formatApiErrorMessage,
} from "@/lib/api";
import { AppRoutes } from "@/lib/app-routes";
import {
  buildDrillItems,
  type DrillItem,
  type PatternSlot,
  type SentencePattern,
} from "@/lib/drills/drill-generator";
import { normalizeAnswer } from "@/lib/practice/answer-matcher";


export function SubstitutionDrillSession({ patternId }: { patternId: string }) {
  const client = useMemo(() => createDefaultApiClient(), []);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<DrillItem[]>([]);
  const [slotsById, setSlotsById] = useState<Map<string, PatternSlot>>(new Map());
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle");
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const result = await chunksApi.getPatternById(client, patternId);
      if (!active) return;
      if (!result.ok) {
        setError(formatApiErrorMessage(result.error));
        return;
      }
      const pattern = (result.data as { pattern: SentencePattern }).pattern;
      setSlotsById(new Map(pattern.slots.map((slot) => [slot.id, slot])));
      const built = buildDrillItems(pattern);
      if (built.length === 0) {
        setError(
          "This pattern needs at least two fill variants per slot to run a drill.",
        );
        return;
      }
      setItems(built);
    })();
    return () => {
      active = false;
    };
  }, [client, patternId]);

  const current = items[index];

  function submitAnswer(event: React.FormEvent) {
    event.preventDefault();
    if (!current) return;
    const slot = slotsById.get(current.slotId);
    const wanted = normalizeAnswer(answer);
    const matched =
      wanted.length > 0 &&
      (normalizeAnswer(current.answer) === wanted ||
        slot?.variants.some((v) => normalizeAnswer(v.text) === wanted));
    if (matched) {
      setFeedback("correct");
      setCorrectCount((count) => count + 1);
      setTimeout(() => {
        setFeedback("idle");
        setAnswer("");
        if (index + 1 >= items.length) {
          setDone(true);
        } else {
          setIndex((value) => value + 1);
        }
      }, 600);
    } else {
      setFeedback("wrong");
    }
  }

  if (error) {
    return (
      <p className="text-red-700">
        {error}{" "}
        <Link href={AppRoutes.home} className="underline">
          Home
        </Link>
      </p>
    );
  }

  if (!current && !done) {
    return <p className="text-slate-600">Loading drill…</p>;
  }

  if (done) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Drill complete</h1>
        <p className="text-slate-700">
          {correctCount} / {items.length} correct
        </p>
        <Link href={AppRoutes.home} className="text-emerald-800 underline">
          Back to Home
        </Link>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Substitution drill</h1>
      <ul className="space-y-1 text-sm text-slate-700">
        {current.examples.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
      <p className="text-lg font-medium">{current.prompt}</p>
      {current.cue ? (
        <p className="text-sm text-slate-600">Hint: {current.cue}</p>
      ) : null}
      <form onSubmit={submitAnswer} className="space-y-3">
        <input
          className="w-full rounded-lg border px-3 py-2"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type the missing word or phrase"
          autoComplete="off"
        />
        {feedback === "wrong" ? (
          <p className="text-sm text-red-700">Not quite — try again.</p>
        ) : null}
        {feedback === "correct" ? (
          <p className="text-sm text-emerald-700">Correct!</p>
        ) : null}
        <button
          type="submit"
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
        >
          Check
        </button>
      </form>
      <p className="text-xs text-slate-500">
        Item {index + 1} of {items.length}
      </p>
    </div>
  );
}
