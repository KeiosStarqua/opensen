import { createNeonAuth } from "@neondatabase/auth/next/server";

function requiredEnv(name: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(
      `Missing ${name}. Set VITE_NEON_AUTH_URL and NEON_AUTH_COOKIE_SECRET in web/.env.local (and in the Vercel project for deploys).`,
    );
  }
  return trimmed;
}

const baseUrl = requiredEnv(
  "VITE_NEON_AUTH_URL",
  process.env.VITE_NEON_AUTH_URL,
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
