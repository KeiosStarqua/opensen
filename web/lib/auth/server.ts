import { createNeonAuth } from "@neondatabase/auth/next/server";

function requiredEnv(name: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(
      `Missing ${name}. Set it in web/.env.local (NEON_AUTH_BASE_URL, or VITE_NEON_AUTH_URL as a fallback, and NEON_AUTH_COOKIE_SECRET).`,
    );
  }
  return trimmed;
}

const baseUrl = requiredEnv(
  "NEON_AUTH_BASE_URL",
  process.env.NEON_AUTH_BASE_URL ??
    process.env.VITE_NEON_AUTH_URL ??
    process.env.NEXT_PUBLIC_NEON_AUTH_URL,
);

const cookieSecret = requiredEnv(
  "NEON_AUTH_COOKIE_SECRET",
  process.env.NEON_AUTH_COOKIE_SECRET,
);

export const auth = createNeonAuth({
  baseUrl,
  cookies: {
    secret: cookieSecret,
  },
});
