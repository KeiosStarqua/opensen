"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { ONBOARDING_COMPLETE_KEY, onboardingEntryHref } from "@/lib/onboarding-storage";
import {
  useOnboardingStatus,
  useSetOnboardingComplete,
} from "@/lib/query/hooks/onboarding";
import { useOnboardingComplete } from "@/lib/use-onboarding-complete";

/**
 * `/onboarding` reads the account flag. A finished account goes to the app.
 * A browser that finished onboarding before that flag existed copies its
 * local mark onto the account once, then leaves.
 *
 * Once the wizard is admitted, a later write (finishing this visit) does not
 * replace the route out from under the result step.
 */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const status = useOnboardingStatus();
  const setComplete = useSetOnboardingComplete();
  const legacyComplete = useOnboardingComplete();
  const [admitted, setAdmitted] = useState(false);
  const legacySyncStarted = useRef(false);

  const known = status.isSuccess;
  const complete = status.data?.complete === true;
  const failed = status.isError || setComplete.isError;
  const readyForWizard = known && !complete && !legacyComplete;
  const showWizard = admitted || failed || readyForWizard;

  if (showWizard && !admitted) {
    setAdmitted(true);
  }

  const needsLegacySync = known && !complete && legacyComplete && !admitted;

  useEffect(() => {
    if (!needsLegacySync || legacySyncStarted.current) return;
    legacySyncStarted.current = true;
    setComplete.mutate(true, {
      onSuccess: () => {
        window.localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
      },
    });
  }, [needsLegacySync, setComplete]);

  useEffect(() => {
    if (admitted) return;
    const href = onboardingEntryHref(complete);
    if (href) router.replace(href);
  }, [admitted, complete, router]);

  if (!showWizard) return null;
  return children;
}
