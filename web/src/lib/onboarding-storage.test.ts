import { describe, expect, it } from "vitest";

import { AppRoutes } from "@/lib/app-routes";
import { onboardingEntryHref } from "@/lib/onboarding-storage";

describe("onboardingEntryHref", () => {
  it("sends a learner who already finished onboarding into the app", () => {
    expect(onboardingEntryHref(true)).toBe(AppRoutes.home);
  });

  it("keeps a new learner on the onboarding route", () => {
    expect(onboardingEntryHref(false)).toBeNull();
  });
});
