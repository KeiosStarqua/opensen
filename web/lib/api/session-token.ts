/**
 * Neon Auth session JWT for `Authorization: Bearer`, or null when signed out.
 * The SDK caches the session until the JWT expires, so calling this per request is cheap.
 */
export async function getSessionToken(): Promise<string | null> {
  const { authClient } = await import("@/lib/auth/client");
  const { data } = await authClient.getSession();
  return data?.session?.token ?? null;
}
