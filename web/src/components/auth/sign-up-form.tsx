import { AppLink } from "@/components/app-link";
import { useServerFn } from "@tanstack/react-start";
import { useActionState } from "react";

import { AuthFrame, authButtonClass, authFieldClass } from "./auth-frame";
import { AppRoutes } from "@/lib/app-routes";

import { signUpWithEmail, type AuthFormResult } from "@/lib/auth/auth.functions";

export function SignUpForm({ redirectTo }: { redirectTo: string }) {
  const submit = useServerFn(signUpWithEmail);
  const [state, formAction, isPending] = useActionState(
    async (_previous: AuthFormResult, formData: FormData): Promise<AuthFormResult> =>
      (await submit({ data: { name: field(formData, "name"), email: field(formData, "email"), password: field(formData, "password"), redirectTo: field(formData, "redirectTo") } })) ?? null,
    null,
  );

  return (
    <AuthFrame
      title="Create account"
      footer={
        <>
          Already have an account?{" "}
          <AppLink
            href={
              redirectTo
                ? `${AppRoutes.signIn}?redirectTo=${encodeURIComponent(redirectTo)}`
                : AppRoutes.signIn
            }
            className="font-semibold text-emerald-800 hover:underline"
          >
            Sign in
          </AppLink>
        </>
      }
    >
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <label className="block text-sm font-medium" htmlFor="name">
          Name
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Your name"
            className={authFieldClass}
          />
        </label>
        <label className="block text-sm font-medium" htmlFor="email">
          Email address
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className={authFieldClass}
          />
        </label>
        <label className="block text-sm font-medium" htmlFor="password">
          Password
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            className={authFieldClass}
          />
        </label>
        {state?.error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {state.error}
          </p>
        ) : null}
        <button type="submit" disabled={isPending} className={authButtonClass}>
          {isPending ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthFrame>
  );
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
