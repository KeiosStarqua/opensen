/**
 * Path prefixes that require a signed-in learner. `/`, `/auth/*`, and
 * `/api/auth/*` stay public. Checked on the server for every page request
 * (`authRequestMiddleware`) and again by the `_app` route guard on client
 * navigation.
 */
export const protectedPathPrefixes = [
  "/onboarding",
  "/home",
  "/learn",
  "/practice",
  "/explore",
  "/library",
  "/saved",
  "/profile",
  "/patterns",
  "/today",
  "/situations",
  "/plan",
  "/settings",
  "/export",
  "/chunks",
  "/dialogues",
  "/drills",
  "/account",
] as const;

export function isProtectedPath(pathname: string): boolean {
  return protectedPathPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** `/auth/sign-in?redirectTo=<path+search>`, so sign-in returns the learner here. */
export function signInUrlFor(pathname: string, search: string): string {
  const target =
    pathname.startsWith("/") && !pathname.startsWith("//")
      ? `${pathname}${search}`
      : "/home";
  return `/auth/sign-in?redirectTo=${encodeURIComponent(target)}`;
}
