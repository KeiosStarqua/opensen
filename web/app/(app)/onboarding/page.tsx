import Link from "next/link";

import { OnboardingForm } from "@/components/onboarding-form";
import { siteConfig } from "@/lib/site";

export const metadata = {
  title: "Start practicing",
  description:
    "Tell OpenSen what you want to speak English for and describe the conversation you need soon.",
};

export default function OnboardingPage() {
  return (
    <div className="min-h-full bg-[#f8f6f2] text-slate-900">
      <header className="border-b border-slate-200/80 bg-[#f8f6f2]/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Back to home
          </Link>
          <p className="text-sm font-semibold text-slate-900">
            {siteConfig.name}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Step 1 of 2
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            What do you want to speak English for?
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Pick the closest match. OpenSen will shape your first practice set
            around a real conversation you need soon.
          </p>
        </div>

        <OnboardingForm />
      </main>
    </div>
  );
}
