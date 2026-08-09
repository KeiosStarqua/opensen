export const siteConfig = {
  name: "OpenSen",
  tagline: "Open Sentence",
  description:
    "OpenSen turns real-life situations into reusable sentence patterns you can remember, adapt, and speak automatically.",
  trialHref: "/onboarding",
} as const;

export const heroCopy = {
  headline: "Speak without translating in your head.",
  subheadline: siteConfig.description,
  coreMessage: "Learn fewer patterns. Say more things.",
} as const;

export const onboardingGoals = [
  "Travel",
  "Work",
  "Study abroad",
  "Daily conversations",
  "Dating and social life",
  "Custom situation",
] as const;
