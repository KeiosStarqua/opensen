"use client";

import { BrandMark } from "@/components/brand-mark";

export function LessonPreview() {
  function speakLine() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance("May I see your passport?");
    utterance.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div id="preview" className="relative pb-16 sm:pb-20">
      <div className="rounded-[26px] bg-[#1b1d1c] p-1.5 shadow-[0_22px_50px_rgba(23,48,40,0.22)] sm:rounded-[30px] sm:p-2">
        <div className="overflow-hidden rounded-[20px] bg-white sm:rounded-[24px]">
          <div className="flex min-h-[210px] sm:min-h-[250px]">
            <aside className="flex w-[68px] shrink-0 flex-col gap-1 bg-[#f4faf6] px-1.5 py-3 sm:w-[78px] sm:px-2">
              <p className="flex flex-col items-center gap-0.5 text-[9px] font-extrabold leading-none text-[#173028]">
                <BrandMark className="h-4 w-4" />
                OpenSen
              </p>
              <SideLink label="Home" />
              <SideLink label="Learn" active />
              <SideLink label="Practice" />
              <SideLink label="Explore" />
              <SideLink label="Library" />
            </aside>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <p className="truncate text-[11px] font-extrabold text-[#173028] sm:text-xs">
                  At the Airport
                </p>
                <p className="text-[10px] font-bold text-[#7b8c83]">2 / 8</p>
              </div>
              <div className="mx-3 h-1 overflow-hidden rounded-full bg-[#e4eee6]">
                <div className="h-full w-1/4 rounded-full bg-[#1c8f4e]" />
              </div>
              <img
                src="/landing/landing-airport-screen.png"
                alt="Sen waving on the grass in front of an airplane and airport terminal"
                className="mt-2 h-full min-h-[140px] w-full flex-1 object-cover object-[center_60%] sm:min-h-[170px]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-1 -left-[8%] w-[56%] max-w-[220px] rounded-[24px] bg-[#1b1d1c] p-1.5 shadow-[0_16px_40px_rgba(23,48,40,0.28)]">
        <div className="overflow-hidden rounded-[18px] bg-[#f7fbf8] px-3 pb-3 pt-2.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-[#7b8c83]">
            <span>At the Airport</span>
            <span>2 / 8</span>
          </div>
          <img
            src="/landing/sen-bust.png"
            alt=""
            className="mx-auto mt-1 h-14 w-14 rounded-full object-cover object-[center_20%]"
          />
          <p className="mt-1 text-center text-[13px] font-extrabold leading-tight text-[#173028]">
            May I see your passport?
          </p>
          <button
            type="button"
            onClick={speakLine}
            className="mx-auto mt-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#1c8f4e] text-white hover:bg-[#12753a]"
            aria-label="Play: May I see your passport?"
          >
            <SpeakerIcon />
          </button>
          <p className="mt-2 text-center text-[10px] leading-snug text-[#5e6f68]">
            <span className="font-extrabold text-[#1c8f4e]">Meaning</span>
            <br />
            A polite way to ask for someone&apos;s passport.
          </p>
        </div>
      </div>
    </div>
  );
}

function SideLink({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <span
      className={`rounded-lg px-1.5 py-1 text-[9px] font-bold leading-tight sm:text-[10px] ${
        active ? "bg-[#e5f6ea] text-[#146b38]" : "text-[#7b8c83]"
      }`}
    >
      {label}
    </span>
  );
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 10h3l4-3v10l-4-3H4z" strokeLinejoin="round" />
      <path d="M16 9.5a3.5 3.5 0 0 1 0 5" strokeLinecap="round" />
    </svg>
  );
}
