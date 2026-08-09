import { ChunkDemo } from "@/components/chunk-demo";
import { CtaButton } from "@/components/cta-button";
import { heroCopy, siteConfig } from "@/lib/site";

const situations = [
  {
    title: "Meeting a professor",
    detail: "Introduce yourself and ask about research directions.",
  },
  {
    title: "Ordering at a café",
    detail: "Handle small talk and requests without freezing.",
  },
  {
    title: "Job interview",
    detail: "Answer common questions with ready sentence patterns.",
  },
];

const learningSteps = [
  {
    step: "Situation",
    detail: "Pick a real conversation you need soon.",
  },
  {
    step: "Sentence",
    detail: "Get a short dialogue tailored to your life.",
  },
  {
    step: "Slot",
    detail: "Practice frames with swappable parts.",
  },
  {
    step: "Speak",
    detail: "Recall patterns under pressure until they feel automatic.",
  },
];

const mvpPath = [
  "Describe the situation you face",
  "Practice a focused set of chunks",
  "Swap slots and re-speak",
  "Review on a spaced schedule",
];

export function LandingPage() {
  return (
    <div className="bg-[#f8f6f2] text-slate-900">
      <header className="border-b border-slate-200/80 bg-[#f8f6f2]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-lg font-semibold tracking-tight">
              {siteConfig.name}
            </p>
            <p className="text-sm text-slate-600">{siteConfig.tagline}</p>
          </div>
          <CtaButton href={siteConfig.trialHref}>Try OpenSen</CtaButton>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pt-24">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Situational speaking reflex
              </p>
              <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl sm:leading-tight">
                {heroCopy.headline}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                {heroCopy.subheadline}
              </p>
              <p className="mt-4 text-base font-medium text-slate-800">
                {heroCopy.coreMessage}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <CtaButton href={siteConfig.trialHref}>
                  Start a practice set
                </CtaButton>
                <CtaButton href="#how-it-works" variant="secondary">
                  See how it works
                </CtaButton>
              </div>
            </div>

            <ChunkDemo />
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight">
                Built for conversations you actually need
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                OpenSen does not ask you to memorize random sentences. It turns
                the situations in your life into patterns you can speak on
                demand.
              </p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {situations.map((situation) => (
                <article
                  key={situation.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
                >
                  <h3 className="text-lg font-semibold">{situation.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {situation.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight">
              Situation → Sentence → Slot → Speak
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Chunking is the mechanism behind the outcome: whole sentence
              patterns with swappable slots, retrieved automatically instead of
              built word by word while you talk.
            </p>
          </div>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {learningSteps.map((item, index) => (
              <li
                key={item.step}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <p className="text-sm font-semibold text-emerald-700">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-xl font-semibold">{item.step}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.detail}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">
                A short path from situation to speaking practice
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                The first session stays focused on what matters: hear the
                dialogue, pick key chunks, swap slots, and speak again. No deck
                setup. No grammar course. No chat companion.
              </p>
            </div>
            <ul className="space-y-3">
              {mvpPath.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <span
                    className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span className="text-sm leading-6 text-slate-700">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="rounded-3xl bg-slate-900 px-8 py-12 text-center text-white sm:px-12">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Ready to speak with fewer patterns and more confidence?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Tell OpenSen what conversation you need next and start your first
              practice set in under a minute.
            </p>
            <div className="mt-8 flex justify-center">
              <CtaButton
                href={siteConfig.trialHref}
                className="bg-white text-slate-900 hover:bg-slate-100 focus-visible:outline-white"
              >
                Try OpenSen free
              </CtaButton>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. Speak English
            without translating in your head.
          </p>
          <p>Mnemonic: Situation → Sentence → Slot → Speak.</p>
        </div>
      </footer>
    </div>
  );
}
