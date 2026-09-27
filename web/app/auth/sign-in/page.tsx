import { SignInForm } from "./sign-in-form";
import { safeNextPath } from "@/lib/auth/redirect";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;
  return <SignInForm redirectTo={redirectTo ? safeNextPath(redirectTo) : ""} />;
}
