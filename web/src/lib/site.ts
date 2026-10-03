export const siteConfig = {
  name: "OpenSen",
  tagline: "A kinder, smarter way to learn languages",
  description:
    "OpenSen helps kids and beginners learn languages through real situations, fun stories, and interactive conversations — not just isolated words.",
  trialHref: "/onboarding",
  updatesHref: "https://opensen.substack.com",
} as const;

export const heroCopy = {
  headline: "Real sentences for real life",
  subheadline: siteConfig.description,
  coreMessage: "Small sentences. Big adventures.",
} as const;

export { onboardingGoalLabels as onboardingGoals } from "./onboarding-goals";
