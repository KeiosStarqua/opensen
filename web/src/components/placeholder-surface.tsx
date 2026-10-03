import { AppLink } from "@/components/app-link";

import { BrandMark } from "@/components/brand-mark";

type PlaceholderSurfaceProps = {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  paramHint?: string;
};

export function PlaceholderSurface({
  title,
  description = "Feature UI ships in a follow-up issue. This route is wired for navigation and QA.",
  backHref = "/today",
  backLabel = "Back to Today",
  paramHint,
}: PlaceholderSurfaceProps) {
  return (
    <div className="min-h-full bg-[#f8f6f2] text-slate-900">
      <header className="border-b border-slate-200/80 bg-[#f8f6f2]/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <AppLink
            href={backHref}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← {backLabel}
          </AppLink>
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <BrandMark className="h-6 w-6" />
            OpenSen
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">{description}</p>
        {paramHint ? (
          <p className="mt-2 font-mono text-sm text-slate-500">{paramHint}</p>
        ) : null}
      </main>
    </div>
  );
}
