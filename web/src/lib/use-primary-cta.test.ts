import { describe, expect, it } from "vitest";

import { AppRoutes } from "@/lib/app-routes";
import { siteConfig } from "@/lib/site";
import { resolvePrimaryCta } from "@/lib/use-primary-cta";

describe("resolvePrimaryCta", () => {
  it("sends a signed-out visitor to the start step with Get started", () => {
    expect(
      resolvePrimaryCta({ signedIn: false, onboardingComplete: false }),
    ).toEqual({
      href: siteConfig.trialHref,
      label: "Get started",
    });
    expect(
      resolvePrimaryCta({ signedIn: false, onboardingComplete: true }),
    ).toEqual({
      href: siteConfig.trialHref,
      label: "Get started",
    });
  });

  it("sends a signed-in learner who has not finished onboarding to the wizard", () => {
    expect(
      resolvePrimaryCta({ signedIn: true, onboardingComplete: false }),
    ).toEqual({
      href: AppRoutes.onboarding,
      label: "Get started",
    });
  });

  it("opens the app when the signed-in learner has finished onboarding", () => {
    expect(
      resolvePrimaryCta({ signedIn: true, onboardingComplete: true }),
    ).toEqual({
      href: AppRoutes.home,
      label: "Open App",
    });
  });

  it("keeps a custom get-started label until onboarding is finished", () => {
    expect(
      resolvePrimaryCta(
        { signedIn: false, onboardingComplete: false },
        "Start learning free",
      ).label,
    ).toBe("Start learning free");
    expect(
      resolvePrimaryCta(
        { signedIn: true, onboardingComplete: false },
        "Start learning free",
      ).label,
    ).toBe("Start learning free");
    expect(
      resolvePrimaryCta(
        { signedIn: true, onboardingComplete: true },
        "Start learning free",
      ).label,
    ).toBe("Open App");
  });
});
