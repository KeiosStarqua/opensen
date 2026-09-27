/**
 * Web route paths — mirrors mobile `AppRoutes` in
 * `mobile/lib/core/routing/app_routes.dart`.
 */
export const AppRoutes = {
  onboarding: "/onboarding",

  home: "/home",
  learn: "/learn",
  learnTopic: (id: string) => `/learn/${id}`,
  learnStep: (topicId: string, stepId: string) => `/learn/${topicId}/${stepId}`,
  practice: "/practice",
  practiceSpeak: "/practice/speak",
  practiceDone: "/practice/done",
  explore: "/explore",
  profile: "/profile",
  patterns: "/patterns",

  today: "/today",
  library: "/library",
  situations: "/situations",
  plan: "/plan",

  situation: (id: string) => `/situations/${id}`,
  buildDialogue: (situationId: string) => `/situations/${situationId}/build`,
  dialogue: (id: string) => `/dialogues/${id}`,
  newChunk: "/chunks/new",
  chunk: (id: string) => `/chunks/${id}`,
  drill: (patternId: string) => `/drills/${patternId}`,
  practiceSession: "/practice/session",
  settings: "/settings",
  export: "/export",

  signIn: "/auth/sign-in",
  signUp: "/auth/sign-up",
  account: "/account/settings",
} as const;

export const shellTabRoutes = [
  { href: AppRoutes.home, label: "Home" },
  { href: AppRoutes.learn, label: "Learn" },
  { href: AppRoutes.practice, label: "Practice" },
  { href: AppRoutes.explore, label: "Explore" },
  { href: AppRoutes.library, label: "Library" },
] as const;
