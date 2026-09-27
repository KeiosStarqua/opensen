"use client";

import { signOut } from "@/app/account/settings/actions";

export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOut}>
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
