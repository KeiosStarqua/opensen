"use client";

import { useState } from "react";

const choices = ["a coffee", "a ticket", "some water"] as const;

export function PatternCard() {
  const [slot, setSlot] = useState<(typeof choices)[number]>("a coffee");

  return (
    <article className="flex h-full flex-col rounded-[28px] bg-[#f3f7ef] p-3 shadow-[0_10px_30px_rgba(23,48,40,0.04)]">
      <div className="flex flex-1 flex-col justify-center rounded-[22px] bg-[#f7faf4] px-3 py-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7b8c83]">
          Sentence
        </p>
        <div className="mt-3 flex items-start gap-2">
          <p className="rounded-2xl bg-[#e5f6ea] px-3 py-2 text-sm font-extrabold text-[#146b38]">
            I&apos;d like to
          </p>
          <ul className="flex flex-1 flex-col gap-1.5">
            {choices.map((choice) => {
              const selected = choice === slot;
              return (
                <li key={choice}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSlot(choice)}
                    className={`w-full rounded-xl px-2.5 py-1.5 text-left text-[13px] font-bold ${
                      selected
                        ? "bg-white text-[#173028] shadow-sm ring-1 ring-[#b7e0c4]"
                        : "bg-white/70 text-[#5e6f68]"
                    }`}
                  >
                    {choice}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <p className="mt-3 text-center text-sm font-extrabold text-[#173028]">
          I&apos;d like {slot}.
        </p>
        <span
          className="mx-auto mt-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#1c8f4e] shadow-sm"
          aria-hidden
        >
          <SpeakerIcon />
        </span>
      </div>
      <div className="px-2 pb-2 pt-4">
        <h3 className="text-base font-extrabold text-[#173028]">Learn by patterns</h3>
        <p className="mt-1 text-sm leading-5 text-[#5e6f68]">
          Remember useful sentence patterns, not just individual words.
        </p>
      </div>
    </article>
  );
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 10h3l4-3v10l-4-3H4z" strokeLinejoin="round" />
      <path d="M16 9.5a3.5 3.5 0 0 1 0 5" strokeLinecap="round" />
    </svg>
  );
}
