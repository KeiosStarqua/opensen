"use server";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/server";
import { safeNextPath } from "@/lib/auth/redirect";
import { captureOperationalError } from "@/lib/observability/operational-error";

export async function signInWithEmail(
  _prevState: { error: string } | null,
  formData: FormData,
) {
  const { error } = await auth.signIn.email({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    const message = error.message || "Failed to sign in. Try again";
    captureOperationalError(new Error(message), {
      surface: "auth",
      action: "sign-in",
    });
    return { error: message };
  }

  redirect(safeNextPath(formData.get("redirectTo") as string | null));
}
