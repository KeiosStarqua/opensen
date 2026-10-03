"use server";

import { redirect } from "next/navigation";

import { AppRoutes } from "@/lib/app-routes";
import { auth } from "@/lib/auth/server";
import { reportAuthFormError } from "@/lib/observability/auth-form-error";

export async function updateDisplayName(
  _prevState: { error: string } | null,
  formData: FormData,
) {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  if (!name) {
    const message = "Name must be provided.";
    reportAuthFormError("update-name", message, { reason: "empty-field" });
    return { error: message };
  }

  const { error } = await auth.updateUser({ name });
  if (error) {
    const message = error.message || "Could not update your name";
    reportAuthFormError("update-name", message, { sdkError: error });
    return { error: message };
  }

  redirect(AppRoutes.account);
}

export async function signOut() {
  await auth.signOut();
  redirect(AppRoutes.signIn);
}
