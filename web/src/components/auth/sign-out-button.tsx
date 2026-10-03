import { useServerFn } from "@tanstack/react-start";
import type { FormEvent } from "react";

import { signOut } from "@/lib/auth/auth.functions";

export function SignOutButton({ className }: { className?: string }) {
  const runSignOut = useServerFn(signOut);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSignOut();
  }

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="submit"
        aria-label="Sign out"
        className={
          className ??
          "rounded-full bg-white px-3 py-2 text-xs font-extrabold text-sen-ink shadow-sm hover:bg-sen-soft"
        }
      >
        Sign out
      </button>
    </form>
  );
}
