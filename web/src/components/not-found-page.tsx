import { AppLink } from "@/components/app-link";

/** Rendered for unknown paths and `notFound()` (HTTP 404). */
export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-start justify-center gap-4 px-6">
      <p className="text-sm font-semibold text-emerald-800">404</p>
      <h1 className="text-2xl font-semibold text-slate-900">This page could not be found.</h1>
      <AppLink href="/" className="text-sm font-semibold text-emerald-800 hover:underline">
        Back to OpenSen
      </AppLink>
    </main>
  );
}
