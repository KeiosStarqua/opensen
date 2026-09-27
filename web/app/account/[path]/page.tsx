import { AccountView } from "@neondatabase/auth-ui";
import { accountViewPaths } from "@neondatabase/auth-ui/server";
import Link from "next/link";

import { AppRoutes } from "@/lib/app-routes";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(accountViewPaths).map((path) => ({ path }));
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 bg-[#f8f6f2] p-4 text-slate-900 md:p-8">
      <Link
        href={AppRoutes.profile}
        className="text-sm font-semibold text-emerald-800 hover:underline"
      >
        Back to profile
      </Link>
      <AccountView path={path} />
    </main>
  );
}
