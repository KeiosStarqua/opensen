import { useServerFn } from "@tanstack/react-start";
import { useActionState } from "react";

import { authButtonClass, authFieldClass } from "./auth-frame";

import { updateDisplayName, type AuthFormResult } from "@/lib/auth/auth.functions";

export function AccountForm({ name }: { name: string }) {
  const submit = useServerFn(updateDisplayName);
  const [state, formAction, isPending] = useActionState(
    async (_previous: AuthFormResult, formData: FormData): Promise<AuthFormResult> =>
      (await submit({ data: { name: field(formData, "name") } })) ?? null,
    null,
  );

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

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
