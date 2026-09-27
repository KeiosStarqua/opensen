import Link from "next/link";
import type { ReactNode } from "react";

export function AuthFrame({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#f8f6f2] p-4 text-slate-900">
      <Link href="/" className="text-lg font-semibold tracking-tight text-emerald-800">
        OpenSen
      </Link>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-center text-2xl font-semibold tracking-tight">{title}</h1>
        <div className="mt-6 flex flex-col gap-4">{children}</div>
        <div className="mt-5 text-center text-sm text-slate-600">{footer}</div>
      </div>
    </main>
  );
}

export const authFieldClass =
  "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600";

export const authButtonClass =
  "flex w-full justify-center rounded-full bg-emerald-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60";
