import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/server";

function loginUrlFor(request: NextRequest): string {
  const pathname = request.nextUrl.pathname;
  const safe =
    pathname.startsWith("/") && !pathname.startsWith("//")
      ? `${pathname}${request.nextUrl.search}`
      : "/home";
  return `/auth/sign-in?redirectTo=${encodeURIComponent(safe)}`;
}

export async function proxy(request: NextRequest) {
  if (request.headers.has("next-action")) {
    return NextResponse.next();
  }
  return auth.middleware({ loginUrl: loginUrlFor(request) })(request);
}

export const config = {
  matcher: [
    "/onboarding/:path*",
    "/home/:path*",
    "/learn/:path*",
    "/practice/:path*",
    "/explore/:path*",
    "/library/:path*",
    "/saved/:path*",
    "/profile/:path*",
    "/patterns/:path*",
    "/today/:path*",
    "/situations/:path*",
    "/plan/:path*",
    "/settings/:path*",
    "/export/:path*",
    "/chunks/:path*",
    "/dialogues/:path*",
    "/drills/:path*",
    "/account/:path*",
  ],
};
