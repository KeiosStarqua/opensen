/**
 * Learner id from a Neon Auth session, or null when signed out.
 * Email is only a fallback so a session without `user.id` still scopes
 * the onboarding query away from the signed-out cache entry.
 */
export function signedInUserId(
  session:
    | { user?: { id?: string | null; email?: string | null } | null }
    | null
    | undefined,
): string | null {
  const user = session?.user;
  if (!user) return null;
  if (typeof user.id === "string" && user.id.length > 0) return user.id;
  if (typeof user.email === "string" && user.email.length > 0) return user.email;
  return null;
}
