"use server";

import { redirect } from "next/navigation";

import { AppRoutes } from "@/lib/app-routes";
import { auth } from "@/lib/auth/server";

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
    return { error: error.message || "Could not update your name" };
  }

  redirect(AppRoutes.account);
}

export async function signOut() {
  await auth.signOut();
  redirect(AppRoutes.signIn);
}
