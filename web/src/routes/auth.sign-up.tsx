import { createFileRoute } from "@tanstack/react-router";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { safeNextPath } from "@/lib/auth/redirect";
import { pageTitle } from "@/lib/page-title";
import { optionalString } from "@/lib/routing/search";

export const Route = createFileRoute("/auth/sign-up")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirectTo: optionalString(search.redirectTo),
  }),
  head: () => ({ meta: [pageTitle("Create account")] }),
  headers: () => ({ "Cache-Control": "private, no-store" }),
  component: SignUpPage,
});

function SignUpPage() {
  const { redirectTo } = Route.useSearch();
  return <SignUpForm redirectTo={redirectTo ? safeNextPath(redirectTo) : ""} />;
}
