"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { flushSync } from "react-dom";

import { AppRoutes } from "@/lib/app-routes";
import { applyHint, openingPlacement, sameOrder, wordsOf } from "@/lib/studio/model";

import { LightbulbIcon, SpeakerIcon } from "./icons";
import { MascotGlyph } from "./mascot";
import { CheckInScene } from "./scenes";
import { speakText } from "./speak";
import { useStudio } from "./studio-provider";
import { PracticeHeader, PrimaryButton } from "./ui";

export function WordOrderScreen() {
  const studio = useStudio();
  const item = studio.practice.items[studio.practice.index];
  if (!item || item.kind !== "order") {
    return (
      <Puzzle
        key="fallback"
        text={studio.practice.items.find((entry) => entry.kind === "order")?.text ?? "May I see your passport?"}
        current={studio.practice.index + 1}
        total={studio.practice.items.length}
      />
    );
  }
  return (
    <Puzzle
      key={`${studio.practice.index}:${item.text}`}
      text={item.text}
      current={studio.practice.index + 1}
      total={studio.practice.items.length}
    />
  );
}

function Puzzle({
  text,
  current,
  total,
}: {
  text: string;
  current: number;
  total: number;
}) {
  const studio = useStudio();
  const router = useRouter();
  const opening = openingPlacement(text);
  const [placed, setPlaced] = useState(opening.placed);
  const [bank, setBank] = useState(opening.bank);
  const [status, setStatus] = useState<"idle" | "incomplete" | "wrong" | "right">("idle");
  const target = wordsOf(text);

  function place(index: number) {
    const word = bank[index];
    if (!word || status === "right") return;
    setBank(bank.filter((_, wordIndex) => wordIndex !== index));
    setPlaced([...placed, word]);
    setStatus("idle");
  }

  function unplace(index: number) {
    if (status === "right") return;
    const word = placed[index];
    if (!word) return;
    setPlaced(placed.filter((_, wordIndex) => wordIndex !== index));
    setBank([...bank, word]);
    setStatus("idle");
  }

  function hint() {
    const next = applyHint(text, placed, bank);
    setPlaced(next.placed);
    setBank(next.bank);
    setStatus(sameOrder(next.placed, text) ? "right" : "idle");
  }

  function check() {
    if (placed.length !== target.length) {
      setStatus("incomplete");
      return;
    }
    if (sameOrder(placed, text)) {
      setStatus("right");
      return;
    }
    const left = studio.loseHeart();
    if (left === 0) {
      const fresh = openingPlacement(text);
      setPlaced(fresh.placed.length ? [] : fresh.placed);
      setBank(fresh.placed.length ? [...fresh.placed, ...fresh.bank] : fresh.bank);
      studio.refillHearts();
      setStatus("wrong");
      return;
    }
    setStatus("wrong");
  }

  function continueNext() {
    flushSync(() => {
      studio.advancePractice();
    });
    router.push(AppRoutes.practiceSpeak);
  }

  return (
    <div className="flex flex-col gap-4">
      <PracticeHeader
        backHref={AppRoutes.learn}
        current={current}
        total={total}
        hearts={studio.hearts}
      />
      <section className="rounded-[28px] bg-white p-5 shadow-sm sm:p-7">
        <div className="grid items-center gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="flex items-center gap-3">
              <svg viewBox="-70 -70 140 150" className="h-14 w-14 shrink-0" aria-hidden>
                <MascotGlyph />
              </svg>
              <button
                type="button"
                aria-label="Play the instruction"
                onClick={() => speakText("Put the words in the correct order.")}
                className="grid h-10 w-10 place-items-center rounded-full bg-sen-soft text-sen-primary"
              >
                <SpeakerIcon className="h-5 w-5" />
              </button>
              <p className="font-extrabold">Put the words in the correct order.</p>
            </div>
            <div className="mt-8 flex min-h-16 flex-wrap items-center gap-2" aria-label="Your sentence">
              {placed.map((word, index) => (
                <button
                  key={`${word}-${index}`}
                  type="button"
                  onClick={() => unplace(index)}
                  className={`rounded-full bg-white px-4 py-2 text-lg font-extrabold shadow-md ring-1 ${
                    status === "right"
                      ? "text-sen-primary ring-sen-primary"
                      : status === "wrong"
                        ? "ring-sen-heart"
                        : "ring-[#edf2ee]"
                  }`}
                >
                  {word}
                </button>
              ))}
              {bank.length > 0 ? (
                <span className="inline-block h-11 w-16 rounded-full border-2 border-dashed border-[#d5e0d8]" />
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2" aria-label="Word bank">
              {bank.map((word, index) => (
                <button
                  key={`${word}-bank-${index}`}
                  type="button"
                  onClick={() => place(index)}
                  className="rounded-full bg-[#f4faf6] px-4 py-2 text-lg font-extrabold text-sen-ink ring-1 ring-[#e1ece4] hover:bg-white"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
          <div className="relative min-h-[220px] overflow-hidden rounded-[24px]">
            <CheckInScene />
            <span className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full bg-white text-2xl font-extrabold text-sen-primary shadow">
              ?
            </span>
          </div>
        </div>
        <p role="status" className="mt-4 min-h-5 text-sm font-bold">
          {status === "right" ? (
            <span className="text-sen-primary">That&apos;s the sentence.</span>
          ) : status === "incomplete" ? (
            <span className="text-sen-heart">Place every word, then check.</span>
          ) : status === "wrong" ? (
            <span className="text-sen-heart">Not quite — try another order.</span>
          ) : null}
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={hint}
            disabled={status === "right"}
            className="inline-flex items-center gap-2 text-sm font-extrabold text-sen-muted hover:text-sen-ink disabled:opacity-40"
          >
            <LightbulbIcon className="h-5 w-5 text-sen-gold" />
            Hint
          </button>
          {status === "right" ? (
            <PrimaryButton onClick={continueNext}>Continue</PrimaryButton>
          ) : (
            <PrimaryButton onClick={check}>Check</PrimaryButton>
          )}
        </div>
      </section>
    </div>
  );
}
