"use client";

import Link from "next/link";
import { useActionState } from "react";

import { AuthFrame, authButtonClass, authFieldClass } from "@/components/auth/auth-frame";
import { AppRoutes } from "@/lib/app-routes";

import { signUpWithEmail } from "./actions";

export function SignUpForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, isPending] = useActionState(signUpWithEmail, null);

  return (
    <AuthFrame
      title="Create account"
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={
              redirectTo
                ? `${AppRoutes.signIn}?redirectTo=${encodeURIComponent(redirectTo)}`
                : AppRoutes.signIn
            }
            className="font-semibold text-emerald-800 hover:underline"
          >
            Sign in
          </Link>
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
