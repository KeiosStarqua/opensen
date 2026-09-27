import { AuthView } from "@neondatabase/auth-ui";
import { authViewPaths } from "@neondatabase/auth-ui/server";
import Link from "next/link";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(authViewPaths).map((path) => ({ path }));
}

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#f8f6f2] p-4 text-slate-900">
      <Link href="/" className="text-lg font-semibold tracking-tight text-emerald-800">
        OpenSen
      </Link>
      <AuthView path={path} />
    </main>
  );
}
