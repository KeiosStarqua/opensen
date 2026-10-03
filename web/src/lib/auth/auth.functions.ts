import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { AppRoutes } from "@/lib/app-routes";
import { safeNextPath } from "@/lib/auth/redirect";
import { reportAuthFormError } from "@/lib/observability/auth-form-error";

import { getAuth } from "./auth.server";

/**
 * Auth server functions. These replace the Next.js Server Actions; each one
 * reads and writes the Neon Auth cookies on the server. Callers use
 * `useServerFn` so a thrown `redirect` navigates the router.
 */

export type AuthFormResult = { error: string } | null;

export type SessionUser = { name: string; email: string };

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** The signed-in learner, or null. Safe to call from loaders and guards. */
export const getSessionUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<SessionUser | null> => {
    const { data } = await getAuth().getSession();
    const user = data?.user;
    return user ? { name: user.name, email: user.email } : null;
  },
);

export const signInWithEmail = createServerFn({ method: "POST" })
  .validator((input: { email: string; password: string; redirectTo?: string }) => ({
    email: text(input.email),
    password: text(input.password),
    redirectTo: text(input.redirectTo),
  }))
  .handler(async ({ data }): Promise<AuthFormResult> => {
    const { error } = await getAuth().signIn.email({
      email: data.email,
      password: data.password,
    });
    if (error) {
      const message = error.message || "Failed to sign in. Try again";
      reportAuthFormError("sign-in", message, { sdkError: error });
      return { error: message };
    }
    throw redirect({ href: safeNextPath(data.redirectTo) });
  });

export const signUpWithEmail = createServerFn({ method: "POST" })
  .validator(
    (input: { name: string; email: string; password: string; redirectTo?: string }) => ({
      name: text(input.name),
      email: text(input.email).trim(),
      password: text(input.password),
      redirectTo: text(input.redirectTo),
    }),
  )
  .handler(async ({ data }): Promise<AuthFormResult> => {
    if (!data.email) {
      const message = "Email address must be provided.";
      reportAuthFormError("sign-up", message, { reason: "empty-field" });
      return { error: message };
    }
    const { error } = await getAuth().signUp.email({
      email: data.email,
      name: data.name,
      password: data.password,
    });
    if (error) {
      const message = error.message || "Failed to create account";
      reportAuthFormError("sign-up", message, { sdkError: error });
      return { error: message };
    }
    throw redirect({ href: safeNextPath(data.redirectTo) });
  });

export const updateDisplayName = createServerFn({ method: "POST" })
  .validator((input: { name: string }) => ({ name: text(input.name).trim() }))
  .handler(async ({ data }): Promise<AuthFormResult> => {
    const auth = getAuth();
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      throw redirect({ href: AppRoutes.signIn });
    }
    if (!data.name) {
      const message = "Name must be provided.";
      reportAuthFormError("update-name", message, { reason: "empty-field" });
      return { error: message };
    }
    const { error } = await auth.updateUser({ name: data.name });
    if (error) {
      const message = error.message || "Could not update your name";
      reportAuthFormError("update-name", message, { sdkError: error });
      return { error: message };
    }
    throw redirect({ href: AppRoutes.account });
  });

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  await getAuth().signOut();
  throw redirect({ href: AppRoutes.signIn });
});
