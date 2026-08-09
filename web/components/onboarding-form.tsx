"use client";

import { useState } from "react";

import { CtaButton } from "@/components/cta-button";
import { onboardingGoals } from "@/lib/site";

export function OnboardingForm() {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [situation, setSituation] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedGoal || situation.trim().length === 0) {
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <section className="mt-12 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
        <h2 className="text-2xl font-semibold tracking-tight text-emerald-950">
          Your practice set is queued
        </h2>
        <p className="mt-4 text-sm leading-6 text-emerald-900">
          OpenSen will generate a short dialogue and chunk set for{" "}
          <span className="font-medium">{selectedGoal}</span>: &quot;
          {situation.trim()}&quot;. Web generation is rolling out — you are on
          the early access path.
        </p>
        <div className="mt-6">
          <CtaButton href="/">Back to home</CtaButton>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {onboardingGoals.map((goal) => {
          const selected = selectedGoal === goal;
          return (
            <button
              key={goal}
              type="button"
              onClick={() => setSelectedGoal(goal)}
              aria-pressed={selected}
              className={`rounded-2xl border px-5 py-4 text-left text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                selected
                  ? "border-emerald-500 bg-emerald-50 text-emerald-950"
                  : "border-slate-200 bg-white text-slate-800 hover:border-emerald-300 hover:bg-emerald-50"
              }`}
            >
              {goal}
            </button>
          );
        })}
      </div>

      <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Step 2 of 2
        </p>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight">
          What conversation do you need soon?
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Example: &quot;Meeting my professor for the first time.&quot;
        </p>
        <label className="mt-6 block">
          <span className="sr-only">Describe your upcoming conversation</span>
          <textarea
            rows={4}
            value={situation}
            onChange={(event) => setSituation(event.target.value)}
            placeholder="Describe the situation in your own words..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </label>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={!selectedGoal || situation.trim().length === 0}
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Generate my practice set
          </button>
          <p className="text-sm text-slate-600">
            Takes under a minute once generation is live on web.
          </p>
        </div>
      </section>
    </form>
  );
}
