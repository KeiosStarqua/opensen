import { safeNextPath } from "@/lib/auth/redirect";

import { SignUpForm } from "./sign-up-form";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;
  return <SignUpForm redirectTo={redirectTo ? safeNextPath(redirectTo) : ""} />;
}
