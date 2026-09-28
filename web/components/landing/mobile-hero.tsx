import Link from "next/link";

import { MobileSpotlight } from "@/components/landing/mobile-spotlight";
import { heroCopy, siteConfig } from "@/lib/site";
import { usePrimaryCta } from "@/lib/use-primary-cta";
import { topics } from "@/lib/studio/content";

const trusts = [
  { label: "Fun & engaging", icon: "star", tile: "bg-[#fff4d8] text-[#e0a31a]" },
  { label: "Real-life situations", icon: "pin", tile: "bg-[#e5f6ea] text-[#1c8f4e]" },
  { label: "AI-powered", icon: "spark", tile: "bg-[#f3e9ff] text-[#8b5cf6]" },
  { label: "For all ages", icon: "people", tile: "bg-[#e7f1ff] text-[#3d93e8]" },
] as const;

const slides = [
  {
    image: "/landing/landing-cafe-chat.jpg",
    alt: "Sen ordering a coffee from a barista",
    line: "Can I have a coffee, please?",
    title: "Learn with real conversations",
    detail: "See how OpenSen turns daily situations into fun learning experiences.",
  },
  {
    image: "/landing/landing-card-airport.jpg",
    alt: "Sen with a backpack in front of an airplane",
    line: "May I see your passport?",
    title: "Sentences for real places",
    detail: "Travel, food, school, and the lines you actually need to say.",
  },
  {
    image: "/landing/landing-card-world.jpg",
    alt: "A path through green hills toward a castle",
    line: "One step at a time",
    title: "A path that feels like play",
    detail: "Short stories and challenges make the next sentence easy to start.",
  },
] as const;

export function MobileHero() {
  const cta = usePrimaryCta("Start learning free");
  const situations = topics.length;
  const sentences = topics.reduce(
    (count, topic) =>
      count + topic.lesson.steps.reduce((stepCount, step) => stepCount + step.sentences.length, 0),
    0,
  );
  const lessons = topics.reduce((count, topic) => count + topic.lesson.steps.length, 0);
  const stats = [
    { value: String(situations), label: "Situations", icon: "people" as const },
    { value: String(sentences), label: "Real sentences", icon: "book" as const },
    { value: String(lessons), label: "Short lessons", icon: "globe" as const },
  ];

  return (
    <div className="relative overflow-hidden lg:hidden">
      <section className="relative">
        <img
          src="/landing/landing-hero-mobile-bg.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_28%]"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,rgba(246,243,234,0.94)_0%,rgba(246,243,234,0.78)_38%,rgba(246,243,234,0.2)_62%,transparent_78%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#f6f3ea] via-[#f6f3ea]/85 to-transparent" />

        <div className="relative px-4 pb-2 pt-4">
          <p className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-[#5e6f68] shadow-sm">
            <Leaf className="h-3.5 w-3.5 shrink-0 text-[#1c8f4e]" />
            <span className="truncate">{siteConfig.tagline}</span>
          </p>
          <div className="mt-3 grid grid-cols-[minmax(0,1.12fr)_minmax(8.25rem,0.88fr)] items-end gap-1">
            <div>
              <h1 className="text-[1.85rem] font-extrabold leading-[1.02] tracking-tight text-[#173028]">
                Real sentences
                <span className="mt-0.5 block text-[#1a8a46]">
                  for real life <Sprout />
                </span>
              </h1>
              <p className="mt-3 text-[13px] font-semibold leading-5 text-[#4d6158]">
                {heroCopy.subheadline}
              </p>
            </div>

            <div className="relative">
              <p className="relative z-10 -mb-1 ml-1 max-w-[9.2rem] rounded-2xl rounded-bl-md bg-white px-2.5 py-2 text-[12px] font-extrabold leading-tight text-[#2f4a3c] shadow-[0_8px_18px_rgba(23,48,40,0.12)]">
                Let&apos;s learn something new together!
              </p>
              <img
                src="/landing/landing-sen-reading.png"
                alt="Sen reading a book on the grass"
                className="relative z-0 -mr-2 w-[112%] max-w-none drop-shadow-[0_14px_18px_rgba(23,48,40,0.16)]"
              />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Link
              href={cta.href}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#178a45] py-2 pl-1.5 pr-3.5 text-[13px] font-extrabold text-white shadow-[0_8px_18px_rgba(23,138,69,0.28)] hover:bg-[#12753a]"
            >
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20" aria-hidden>
                <PlayIcon className="ml-0.5 h-3.5 w-3.5" />
              </span>
              <span className="whitespace-nowrap">{cta.label}</span>
            </Link>
            <a
              href="#spotlight"
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-extrabold whitespace-nowrap text-[#173028] shadow-[0_8px_18px_rgba(23,48,40,0.08)]"
            >
              <PlayIcon className="h-4 w-4" />
              Watch video
            </a>
          </div>
        </div>
      </section>

      <ul className="relative grid grid-cols-4 gap-2 px-4 pt-3">
        {trusts.map((item) => (
          <li key={item.label} className="flex flex-col items-center gap-1.5 text-center">
            <span className={`flex h-12 w-full items-center justify-center rounded-2xl ${item.tile}`}>
              <TrustIcon name={item.icon} />
            </span>
            <span className="text-[10px] font-bold leading-tight text-[#5e6f68]">{item.label}</span>
          </li>
        ))}
      </ul>

      <div className="relative mt-4">
        <MobileSpotlight slides={[...slides]} />
      </div>

      <div className="relative mx-4 mt-4 grid grid-cols-3 rounded-[28px] bg-[#e7f6eb] px-2 py-4 text-center">
        {stats.map((stat) => (
          <div key={stat.label}>
            <StatIcon name={stat.icon} />
            <p className="mt-1 text-xl font-extrabold tracking-tight text-[#173028]">{stat.value}</p>
            <p className="text-[11px] font-bold leading-tight text-[#5e6f68]">{stat.label}</p>
          </div>
        ))}
      </div>

      <a
        href="#features"
        className="relative mx-auto mt-4 mb-2 flex w-fit items-center gap-1.5 rounded-full border border-[#d7e3da] bg-white px-4 py-2 text-sm font-extrabold text-[#173028] shadow-sm"
      >
        <ChevronDown />
        Explore more
      </a>

      <LeafSpray className="pointer-events-none absolute -left-3 bottom-6 h-16 w-16 -rotate-12 text-[#7dbe78]/80" />
      <LeafSpray className="pointer-events-none absolute -right-2 bottom-2 h-20 w-20 rotate-[24deg] scale-x-[-1] text-[#8bc97f]/80" />
    </div>
  );
}

function Sprout() {
  return (
    <svg viewBox="0 0 28 28" className="inline-block h-6 w-6 align-[-3px]" aria-hidden>
      <path d="M14 24V13" stroke="#1a8a46" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 15c-5-1-7-5-7-8 4 0 7 2 7 8Z" fill="#3cb56a" />
      <path d="M14 16c5-1 8-4 8-8-4 0-8 2-8 8Z" fill="#1a8a46" />
    </svg>
  );
}

function Leaf({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <path fill="currentColor" d="M13.5 2.2C8 2.4 3.2 6.2 2.4 12.2c3.2-.2 6.2-1.6 8.2-3.8 1.2 2.6.8 5.2.2 6.2 3.6-1.2 5.6-5.4 4.8-9.6-.2-1-.8-2-2.1-2.8Z" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <path d="M7.2 5.2v9.6L15 10 7.2 5.2Z" fill="currentColor" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
      <path d="M3.5 6 8 10.5 12.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function LeafSpray({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden>
      <path fill="currentColor" d="M18 62c8-18 22-30 42-36-8 16-16 28-30 38-6 4-10 4-12-2Z" />
      <path fill="currentColor" d="M28 70c6-14 16-22 32-26-6 12-12 20-22 26-5 3-8 2-10 0Z" opacity=".8" />
    </svg>
  );
}

function TrustIcon({ name }: { name: (typeof trusts)[number]["icon"] }) {
  const common = "h-5 w-5";
  if (name === "star") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden>
        <path fill="currentColor" d="m12 3.2 2.2 5.3 5.8.5-4.4 3.7 1.4 5.6L12 15.6 6.9 18.3l1.4-5.6L4 9l5.8-.5L12 3.2Z" />
      </svg>
    );
  }
  if (name === "pin") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M12 21s6-5.1 6-9.4A6 6 0 0 0 6 11.6C6 15.9 12 21 12 21Z" />
        <circle cx="12" cy="11.4" r="1.7" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (name === "spark") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden>
        <path fill="currentColor" d="M12 2.4 13.6 8 19.2 9.6 13.6 11.2 12 16.8 10.4 11.2 4.8 9.6 10.4 8 12 2.4Z" />
        <path fill="currentColor" d="m18 14 .7 2.1L20.8 17 18.7 17.7 18 19.8 17.3 17.7 15.2 17l2.1-.9L18 14Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={common} aria-hidden>
      <circle cx="8.2" cy="8" r="2.3" fill="currentColor" />
      <circle cx="15.4" cy="8.6" r="1.8" fill="currentColor" />
      <path fill="currentColor" d="M3.6 17.8c.5-2.5 2.2-3.8 4.6-3.8s4.1 1.3 4.6 3.8c.1.6-.3 1.2-.9 1.2H4.5c-.6 0-1-.6-.9-1.2Z" />
      <path fill="currentColor" d="M13.2 15.4c.7-.7 1.7-1 2.6-.8 1.5.3 2.5 1.5 3 3.3.2.6-.3 1.1-.9 1.1h-3.2c-.2 0-.4-.1-.5-.2-.6-1.2-1-2.2-1-3.4Z" />
    </svg>
  );
}

function StatIcon({ name }: { name: "people" | "book" | "globe" }) {
  const common = "mx-auto h-6 w-6 text-[#1c8f4e]";
  if (name === "people") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden>
        <circle cx="8.2" cy="8" r="2.3" fill="currentColor" />
        <circle cx="15.4" cy="8.6" r="1.8" fill="currentColor" />
        <path fill="currentColor" d="M3.6 17.8c.5-2.5 2.2-3.8 4.6-3.8s4.1 1.3 4.6 3.8c.1.6-.3 1.2-.9 1.2H4.5c-.6 0-1-.6-.9-1.2Z" />
        <path fill="currentColor" d="M13.2 15.4c.7-.7 1.7-1 2.6-.8 1.5.3 2.5 1.5 3 3.3.2.6-.3 1.1-.9 1.1h-3.2c-.2 0-.4-.1-.5-.2-.6-1.2-1-2.2-1-3.4Z" />
      </svg>
    );
  }
  if (name === "book") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden>
        <path fill="currentColor" d="M3.2 6.4C3.2 4.5 4.8 3 6.8 3H11v15.6H6.8c-2 0-3.6-1.5-3.6-3.3V6.4Z" />
        <path fill="currentColor" d="M13 3h4.2c2 0 3.6 1.5 3.6 3.4v8.9c0 1.8-1.6 3.3-3.6 3.3H13V3Z" opacity=".7" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4c2.2 2.4 3.3 5.1 3.3 8S14.2 17.6 12 20c-2.2-2.4-3.3-5.1-3.3-8S9.8 6.4 12 4Z" />
    </svg>
  );
}
