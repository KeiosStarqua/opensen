/**
 * Web route paths — mirrors mobile `AppRoutes` in
 * `mobile/lib/core/routing/app_routes.dart`.
 */
export const AppRoutes = {
  onboarding: "/onboarding",

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
} as const;

export const shellTabRoutes = [
  { href: AppRoutes.today, label: "Today" },
  { href: AppRoutes.library, label: "Library" },
  { href: AppRoutes.situations, label: "Situations" },
  { href: AppRoutes.plan, label: "Plan" },
] as const;
