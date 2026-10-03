import { useAppNavigate } from "@/lib/use-app-navigate";
import { useState } from "react";

import { AppRoutes } from "@/lib/app-routes";

import { CheckIcon, MicIcon } from "./icons";
import { SpeakScene } from "./scenes";
import { speakText } from "./speak";
import { useStudio } from "./studio-provider";
import { PracticeHeader, PrimaryButton } from "./ui";

export function SpeakingScreen() {
  const studio = useStudio();
  const navigate = useAppNavigate();
  const item =
    studio.practice.items[studio.practice.index]?.kind === "speak"
      ? studio.practice.items[studio.practice.index]
      : studio.practice.items.find((entry) => entry.kind === "speak");
  const text = item?.text ?? "Could you help me find the station?";
  const [phase, setPhase] = useState<"ready" | "listening" | "heard">("heard");

  function speak() {
    setPhase("listening");
    speakText(text, 1);
    window.setTimeout(() => setPhase("heard"), 1200);
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <PracticeHeader
        backHref={AppRoutes.practice}
        current={studio.practice.index + 1}
        total={studio.practice.items.length}
        hearts={studio.hearts}
      />
      <div className="grid flex-1 gap-4 lg:grid-cols-2">
        <section className="flex flex-col items-center rounded-[28px] bg-gradient-to-b from-[#f3fbf4] to-white px-6 py-8 text-center shadow-sm">
          <SpeakScene />
          <p className="text-sm font-extrabold text-sen-primary">Try speaking!</p>
          <p className="mt-2 max-w-sm text-2xl font-extrabold leading-snug">{text}</p>
          <button
            type="button"
            onClick={speak}
            className={`mt-8 grid h-24 w-24 place-items-center rounded-full bg-sen-primary text-white shadow-[0_10px_24px_rgba(31,157,82,0.3)] hover:bg-sen-primary-dark ${
              phase === "listening" ? "animate-pulse" : ""
            }`}
            aria-label="Click to speak"
          >
            <MicIcon className="h-10 w-10" />
          </button>
          <p className="mt-3 text-sm font-bold text-sen-muted">
            {phase === "listening" ? "Listening…" : "Click to speak"}
          </p>
        </section>

        <section className="flex flex-col rounded-[28px] bg-white p-6 shadow-sm">
          {phase === "heard" ? (
            <>
              <p className="text-sm font-extrabold text-sen-muted">You said</p>
              <p className="mt-2 flex items-start gap-2 text-xl font-extrabold">
                <CheckIcon className="mt-1 h-5 w-5 shrink-0 text-sen-primary" />
                {text}
              </p>
              <ul className="mt-6 space-y-3">
                <Feedback label="Meaning" score="Good" tone="good" />
                <Feedback label="Pronunciation" score="Great" tone="good" />
                <Feedback label="Fluency" score="Keep going" tone="warm" />
              </ul>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-center">
              <p className="max-w-xs font-semibold text-sen-muted">
                Say the sentence, then you&apos;ll see meaning, pronunciation, and fluency.
              </p>
            </div>
          )}
          <div className="mt-auto flex gap-3 pt-8">
            <button
              type="button"
              onClick={() => setPhase("ready")}
              className="h-12 flex-1 rounded-full border-2 border-sen-primary text-sm font-extrabold text-sen-primary hover:bg-sen-soft"
            >
              Try again
            </button>
            <PrimaryButton
              className="flex-1"
              onClick={() => navigate(`${AppRoutes.practiceDone}?claim=${Date.now()}`)}
            >
              Next
            </PrimaryButton>
          </div>
        </section>
      </div>
    </div>
  );
}

function Feedback({
  label,
  score,
  tone,
}: {
  label: string;
  score: string;
  tone: "good" | "warm";
}) {
  return (
    <li className="flex items-center justify-between rounded-2xl bg-[#f4faf5] px-4 py-3">
      <span className="font-extrabold">{label}</span>
      <span className={`font-extrabold ${tone === "good" ? "text-sen-primary" : "text-sen-flame"}`}>
        {score}
      </span>
    </li>
  );
}
