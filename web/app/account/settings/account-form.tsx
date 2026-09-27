"use client";

import { useActionState } from "react";

import { authButtonClass, authFieldClass } from "@/components/auth/auth-frame";

import { updateDisplayName } from "./actions";

export function AccountForm({ name }: { name: string }) {
  const [state, formAction, isPending] = useActionState(updateDisplayName, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="block text-sm font-medium" htmlFor="name">
        Name
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={name}
          autoComplete="name"
          className={authFieldClass}
        />
      </label>
      {state?.error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <button type="submit" disabled={isPending} className={authButtonClass}>
        {isPending ? "Saving..." : "Save name"}
      </button>
    </form>
  );
}
