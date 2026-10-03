"use server";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/server";
import { safeNextPath } from "@/lib/auth/redirect";
import { reportAuthFormError } from "@/lib/observability/auth-form-error";

export async function signUpWithEmail(
  _prevState: { error: string } | null,
  formData: FormData,
) {
  const email = formData.get("email") as string;

  if (!email) {
    const message = "Email address must be provided.";
    reportAuthFormError("sign-up", message, { reason: "empty-field" });
    return { error: message };
  }

  const { error } = await auth.signUp.email({
    email,
    name: formData.get("name") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    const message = error.message || "Failed to create account";
    reportAuthFormError("sign-up", message, { sdkError: error });
    return { error: message };
  }

  redirect(safeNextPath(formData.get("redirectTo") as string | null));
}
