"use client";

import Link from "next/link";
import { useEffect } from "react";

import { AppRoutes } from "@/lib/app-routes";
import { captureOperationalError } from "@/lib/observability/operational-error";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureOperationalError(error, {
      surface: "render",
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col items-start justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold text-slate-900">
        Something went wrong
      </h1>
      <p className="text-slate-600">
        This page hit an unexpected error. You can try again.
      </p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
        >
          Try again
        </button>
        <Link href={AppRoutes.home} className="text-sm text-slate-600">
          Back to home
        </Link>
      </div>
    </div>
  );
}
