"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { onboardingEntryHref } from "@/lib/onboarding-storage";
import { useOnboardingComplete } from "@/lib/use-onboarding-complete";

/**
 * `/onboarding` is the trial entry. A learner who already finished it
 * is sent to the app instead of seeing the wizard again.
 */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const href = onboardingEntryHref(useOnboardingComplete());

  useEffect(() => {
    if (href) router.replace(href);
  }, [href, router]);

  if (href) return null;
  return children;
}
