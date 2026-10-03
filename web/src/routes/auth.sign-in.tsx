import { createFileRoute } from "@tanstack/react-router";

import { SignInForm } from "@/components/auth/sign-in-form";
import { safeNextPath } from "@/lib/auth/redirect";
import { pageTitle } from "@/lib/page-title";
import { optionalString } from "@/lib/routing/search";

export const Route = createFileRoute("/auth/sign-in")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirectTo: optionalString(search.redirectTo),
  }),
  head: () => ({ meta: [pageTitle("Sign in")] }),
  headers: () => ({ "Cache-Control": "private, no-store" }),
  component: SignInPage,
});

function SignInPage() {
  const { redirectTo } = Route.useSearch();
  return <SignInForm redirectTo={redirectTo ? safeNextPath(redirectTo) : ""} />;
}
