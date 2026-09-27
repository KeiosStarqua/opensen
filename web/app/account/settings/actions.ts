"use server";

import { redirect } from "next/navigation";

import { AppRoutes } from "@/lib/app-routes";
import { auth } from "@/lib/auth/server";
import { captureOperationalError } from "@/lib/observability/operational-error";

export async function updateDisplayName(
  _prevState: { error: string } | null,
  formData: FormData,
) {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  if (!name) {
    return { error: "Name must be provided." };
  }

  const { error } = await auth.updateUser({ name });
  if (error) {
    const message = error.message || "Could not update your name";
    captureOperationalError(new Error(message), {
      surface: "auth",
      action: "update-name",
    });
    return { error: message };
  }

  redirect(AppRoutes.account);
}

export async function signOut() {
  await auth.signOut();
  redirect(AppRoutes.signIn);
}
