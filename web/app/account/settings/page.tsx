import Link from "next/link";
import { redirect } from "next/navigation";

import { AppRoutes } from "@/lib/app-routes";
import { auth } from "@/lib/auth/server";

import { AccountForm } from "./account-form";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect(AppRoutes.signIn);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 bg-[#f8f6f2] p-4 text-slate-900 md:p-8">
      <Link href={AppRoutes.profile} className="text-sm font-semibold text-emerald-800 hover:underline">
        Back to profile
      </Link>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="mt-2 text-sm text-slate-600">{session.user.email}</p>
        <div className="mt-6">
          <AccountForm name={session.user.name} />
        </div>
        <form action={signOut} className="mt-6">
          <button
            type="submit"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
