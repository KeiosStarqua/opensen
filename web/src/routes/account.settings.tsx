import { createFileRoute, redirect } from "@tanstack/react-router";

import { AppLink } from "@/components/app-link";
import { AccountForm } from "@/components/auth/account-form";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AppRoutes } from "@/lib/app-routes";
import { getSessionUser } from "@/lib/auth/auth.functions";
import { pageTitle } from "@/lib/page-title";

export const Route = createFileRoute("/account/settings")({
  loader: async () => {
    const user = await getSessionUser();
    if (!user) throw redirect({ href: AppRoutes.signIn });
    return { user };
  },
  head: () => ({ meta: [pageTitle("Account")] }),
  component: AccountSettingsPage,
});

function AccountSettingsPage() {
  const { user } = Route.useLoaderData();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 bg-[#f8f6f2] p-4 text-slate-900 md:p-8">
      <AppLink href={AppRoutes.profile} className="text-sm font-semibold text-emerald-800 hover:underline">
        Back to profile
      </AppLink>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="mt-2 text-sm text-slate-600">{user.email}</p>
        <div className="mt-6">
          <AccountForm name={user.name} />
        </div>
        <div className="mt-6">
          <SignOutButton className="text-sm font-semibold text-slate-600 hover:text-slate-900" />
        </div>
      </div>
    </main>
  );
}
