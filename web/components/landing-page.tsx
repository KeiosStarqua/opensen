"use client";

import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { LandingHeader } from "@/components/landing/landing-header";
import { LessonPreview } from "@/components/landing/lesson-preview";
import { MobileHero } from "@/components/landing/mobile-hero";
import { PatternCard } from "@/components/landing/pattern-card";
import { heroCopy, siteConfig } from "@/lib/site";
import { usePrimaryCta } from "@/lib/use-primary-cta";

const trusts = [
  { label: "Fun & engaging", icon: "spark" },
  { label: "Real-life situations", icon: "pin" },
  { label: "AI-powered", icon: "ai" },
  { label: "For all ages", icon: "people" },
] as const;

const benefits = [
  { label: "Simple and intuitive", tone: "warm" },
  { label: "Engaging visuals and stories", tone: "warm" },
  { label: "Safe and ad-free", tone: "green" },
  { label: "Built with language experts", tone: "green" },
  { label: "Works on web, iOS and Android", tone: "green" },
] as const;

export function LandingPage() {
  const heroCta = usePrimaryCta("Start learning free");
  const kidsCta = usePrimaryCta("Explore the worlds");
  const pricingCta = usePrimaryCta("Start learning free");

  return (
    <div id="top" className="scroll-smooth bg-[#f6f3ea] text-[#173028]">
      <LandingHeader />

      <main>
        <MobileHero />
        <section className="mx-auto hidden max-w-6xl items-center gap-6 px-5 pb-8 pt-8 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-4 lg:px-8 lg:pb-6 lg:pt-12">
          <div>
            <p className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-[#5e6f68] shadow-sm">
              {siteConfig.tagline}
            </p>
            <h1 className="mt-5 max-w-xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Real sentences
              <span className="mt-1 block text-[#1a8a46]">
                for real life <Sprout />
              </span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-[#5e6f68] sm:text-lg">
              {heroCopy.subheadline}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={heroCta.href}
                className="inline-flex items-center justify-center rounded-full bg-[#178a45] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#12753a]"
              >
                {heroCta.label}
                <span aria-hidden className="ml-2">
                  →
                </span>
              </Link>
              <a
                href="#preview"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d5e2d8] bg-white px-5 py-3 text-sm font-extrabold text-[#173028] hover:border-[#1c8f4e]"
              >
                <PlayIcon />
                Watch video
              </a>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-[#6a7b72]">
              {trusts.map((item) => (
                <li key={item.label} className="inline-flex items-center gap-1.5">
                  <TrustIcon name={item.icon} />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative lg:pb-6">
            <img
              src="/landing/landing-hero-world.jpg"
              alt="Sen reading on a rock beside a lake, with a village, castle, and airplane beyond"
              className="w-full"
            />
            <p className="font-script pointer-events-none absolute left-[3%] top-[4%] hidden w-32 text-[1.7rem] leading-[0.9] text-[#2f4a3c] lg:block">
              Small sentences
              <br />
              Big adventures
            </p>
            <div className="relative z-10 mx-auto mt-2 w-full max-w-md lg:absolute lg:top-[18%] lg:right-[4%] lg:left-auto lg:mx-0 lg:mt-0 lg:w-[50%] lg:max-w-none">
              <LessonPreview />
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 px-5 py-10 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Turn everyday moments into language skills
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[#5e6f68]">
              From ordering food to traveling the world, OpenSen teaches useful
              sentences through delightful stories, games, and conversations.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-6xl gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <FeatureCard
              image="/landing/landing-card-airport.jpg"
              imageAlt="Sen with a backpack waving in front of an airplane"
              title="Real-life situations"
              detail="Learn from everyday contexts like travel, food, school, and more."
            />
            <article className="flex h-full flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_10px_30px_rgba(23,48,40,0.05)]">
              <div className="relative aspect-[4/3] bg-[#fffaf3]">
                <img
                  src="/landing/landing-card-talk.jpg"
                  alt="A girl talking with Sen"
                  className="h-full w-full object-cover object-[center_30%]"
                />
                <p className="absolute left-3 top-3 max-w-[78%] rounded-2xl rounded-bl-md bg-white px-3 py-2 text-xs font-extrabold text-[#173028] shadow-sm">
                  Where is the restroom?
                </p>
              </div>
              <div className="px-4 pb-5 pt-4">
                <h3 className="text-base font-extrabold">Interactive conversations</h3>
                <p className="mt-1 text-sm leading-5 text-[#5e6f68]">
                  Practice with AI characters in fun, engaging dialogues.
                </p>
              </div>
            </article>
            <PatternCard />
            <article className="flex h-full flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_10px_30px_rgba(23,48,40,0.05)]">
              <div className="relative aspect-[4/3]">
                <img
                  src="/landing/landing-card-world.jpg"
                  alt="A path through green hills leading to a castle by a lake"
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-[16%] left-[18%] flex gap-1.5">
                  <Step n="1" className="bg-white text-[#173028]" />
                  <Step n="2" className="bg-[#1c8f4e] text-white" />
                  <Step n="3" className="bg-[#e4b322] text-[#173028]" />
                </div>
              </div>
              <div className="px-4 pb-5 pt-4">
                <h3 className="text-base font-extrabold">Gamified learning</h3>
                <p className="mt-1 text-sm leading-5 text-[#5e6f68]">
                  Stay motivated with levels, rewards, and fun challenges.
                </p>
              </div>
            </article>
            <article className="flex h-full flex-col overflow-hidden rounded-[28px] bg-[#f7f8f2] shadow-[0_10px_30px_rgba(23,48,40,0.05)]">
              <div className="relative aspect-[4/3]">
                <img
                  src="/landing/landing-sen-headphones.jpg"
                  alt="Sen wearing headphones"
                  className="h-full w-full object-contain object-bottom"
                />
                <span
                  className="absolute left-[14%] top-[38%] inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#1c8f4e] text-white shadow-md"
                  aria-hidden
                >
                  <MicIcon />
                </span>
              </div>
              <div className="px-4 pb-5 pt-4">
                <h3 className="text-base font-extrabold">Practice speaking</h3>
                <p className="mt-1 text-sm leading-5 text-[#5e6f68]">
                  Improve pronunciation and build real confidence.
                </p>
              </div>
            </article>
          </div>
        </section>

        <section id="for-kids" className="scroll-mt-24 px-5 py-8 lg:px-8 lg:py-16">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <h2 className="max-w-md text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                A learning journey that{" "}
                <span className="text-[#1a8a46]">feels like a game</span>
              </h2>
              <p className="mt-4 max-w-md text-base leading-7 text-[#5e6f68]">
                Children stay motivated through beautiful worlds, lovable
                characters, and meaningful progress. Every lesson is a small
                adventure.
              </p>
              <div className="relative mt-6">
                <img
                  src="/landing/landing-journey-boat.jpg"
                  alt="Sen rowing a wooden boat across a lake toward a castle"
                  className="w-full"
                />
                <p className="font-script pointer-events-none absolute right-[8%] top-[6%] hidden text-2xl leading-none text-[#2f4a3c] sm:block">
                  Learn today
                  <br />
                  to explore
                  <br />
                  tomorrow
                </p>
              </div>
              <Link
                href={kidsCta.href}
                className="mt-5 inline-flex items-center rounded-full bg-[#178a45] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#12753a]"
              >
                {kidsCta.label}
                <span aria-hidden className="ml-2">
                  →
                </span>
              </Link>
            </div>

            <div className="flex flex-col gap-4">
              <article className="rounded-[28px] bg-[#eef8ef] p-6 sm:p-7">
                <h3 className="flex items-center gap-2 text-lg font-extrabold">
                  <HeartIcon />
                  Perfect for kids and beginners
                </h3>
                <ul className="mt-4 space-y-3">
                  {benefits.map((item) => (
                    <li key={item.label} className="flex items-center gap-3 text-sm font-bold">
                      <Check tone={item.tone} />
                      {item.label}
                    </li>
                  ))}
                </ul>
              </article>

              <article
                id="stories"
                className="scroll-mt-24 rounded-[28px] bg-[#f3faf4] p-6 sm:p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-lg font-extrabold leading-snug">
                    “My daughter actually enjoys learning English now!”
                  </p>
                  <HeartIcon />
                </div>
                <p className="mt-3 text-sm leading-6 text-[#5e6f68]">
                  The stories, characters, and real-life situations make it fun
                  and meaningful. She looks forward to her daily practice!
                </p>
                <p className="mt-4 text-[#e4b322]" aria-label="5 out of 5 stars">
                  ★★★★★
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <img
                    src="/landing/landing-parent-avatar.jpg"
                    alt=""
                    className="h-11 w-11 rounded-full object-cover"
                  />
                  <p className="text-sm leading-tight">
                    <span className="block font-extrabold">Thảo Nguyễn</span>
                    <span className="text-[#6a7b72]">Parent</span>
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-24 px-5 py-16 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-8 rounded-[32px] bg-white px-6 py-10 shadow-[0_10px_30px_rgba(23,48,40,0.04)] sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Start free
              </h2>
              <p className="mt-3 max-w-lg text-base leading-7 text-[#5e6f68]">
                The first practice set is free. Pick a real situation, learn the
                sentence, and say it out loud. No deck to set up.
              </p>
            </div>
            <div className="rounded-[24px] bg-[#f3faf4] p-6">
              <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#1a8a46]">
                Free
              </p>
              <p className="mt-2 text-2xl font-extrabold">Real sentences, ready to speak</p>
              <ul className="mt-4 space-y-2 text-sm font-bold text-[#3e5248]">
                <li>Everyday situations</li>
                <li>Sentence patterns you can swap</li>
                <li>Speaking practice on the web</li>
              </ul>
              <Link
                href={pricingCta.href}
                className="mt-6 inline-flex items-center rounded-full bg-[#178a45] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#12753a]"
              >
                {pricingCta.label}
                <span aria-hidden className="ml-2">
                  →
                </span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e4eee6]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8" />
            <div>
              <p className="font-extrabold">{siteConfig.name}</p>
              <p className="text-sm text-[#6a7b72]">{heroCopy.coreMessage}</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-[#3e5248]">
            <a href="#features">Features</a>
            <a href="#for-kids">For Kids</a>
            <a href="#pricing">Pricing</a>
            <a href="#stories">Stories</a>
            <a href={siteConfig.updatesHref}>Updates</a>
          </nav>
          <p className="text-sm text-[#6a7b72]">
            © {new Date().getFullYear()} {siteConfig.name}
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  image,
  imageAlt,
  title,
  detail,
}: {
  image: string;
  imageAlt: string;
  title: string;
  detail: string;
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_10px_30px_rgba(23,48,40,0.05)]">
      <div className="aspect-[4/3] overflow-hidden">
        <img src={image} alt={imageAlt} className="h-full w-full object-cover" />
      </div>
      <div className="px-4 pb-5 pt-4">
        <h3 className="text-base font-extrabold">{title}</h3>
        <p className="mt-1 text-sm leading-5 text-[#5e6f68]">{detail}</p>
      </div>
    </article>
  );
}

function Step({ n, className }: { n: string; className: string }) {
  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold shadow-sm ${className}`}
    >
      {n}
    </span>
  );
}

function Sprout() {
  return (
    <svg viewBox="0 0 28 28" className="inline-block h-7 w-7 align-[-4px]" aria-hidden>
      <path d="M14 24V13" stroke="#1a8a46" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 15c-5-1-7-5-7-8 4 0 7 2 7 8Z" fill="#3cb56a" />
      <path d="M14 16c5-1 8-4 8-8-4 0-8 2-8 8Z" fill="#1a8a46" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
      <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 6.5v7l6-3.5-6-3.5Z" fill="currentColor" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-[#ef5b6c]" aria-hidden>
      <path
        fill="currentColor"
        d="M12 20s-7-4.4-7-9.1C5 8 6.8 6.2 9 6.2c1.3 0 2.4.6 3 1.6.6-1 1.7-1.6 3-1.6 2.2 0 4 1.8 4 4.7C19 15.6 12 20 12 20Z"
      />
    </svg>
  );
}

function Check({ tone }: { tone: "warm" | "green" }) {
  const color = tone === "warm" ? "bg-[#f08c2a]" : "bg-[#1c8f4e]";
  return (
    <span
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white ${color}`}
      aria-hidden
    >
      ✓
    </span>
  );
}

function TrustIcon({ name }: { name: (typeof trusts)[number]["icon"] }) {
  const common = "h-3.5 w-3.5 text-[#1c8f4e]";
  if (name === "spark") {
    return (
      <svg viewBox="0 0 16 16" className={common} aria-hidden>
        <path fill="currentColor" d="M8 1.2 9.2 6 14 7.2 9.2 8.4 8 13.2 6.8 8.4 2 7.2 6.8 6 8 1.2Z" />
      </svg>
    );
  }
  if (name === "pin") {
    return (
      <svg viewBox="0 0 16 16" className={common} fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <path d="M8 14s4-3.2 4-6.2A4 4 0 0 0 4 7.8C4 10.8 8 14 8 14Z" />
        <circle cx="8" cy="7.6" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (name === "ai") {
    return (
      <svg viewBox="0 0 16 16" className={common} fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <circle cx="8" cy="8" r="2" />
        <path d="M8 2.2v1.6M8 12.2v1.6M2.2 8h1.6M12.2 8h1.6M4 4l1.1 1.1M10.9 10.9 12 12M12 4l-1.1 1.1M5.1 10.9 4 12" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" className={common} fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <circle cx="6" cy="6" r="2" />
      <circle cx="11" cy="6.5" r="1.6" />
      <path d="M2.8 12.5c.6-1.8 2-2.7 3.2-2.7s2.6.9 3.2 2.7M9.2 10.2c.7-.5 1.5-.7 2.2-.6 1 .2 1.8 1 2.2 2.4" strokeLinecap="round" />
    </svg>
  );
}
