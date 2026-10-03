import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { getSessionUser } from "@/lib/auth/auth.functions";
import { signInUrlFor } from "@/lib/auth/protected-routes";
import { QueryProvider } from "@/lib/query/query-provider";

/**
 * Signed-in app layout. On a document request the global auth request
 * middleware already checked the session (and answered 307 when signed out),
 * so the guard only runs on client navigation into the app. Leaving `_app`
 * unmounts `QueryProvider`, which drops the learner's cache.
 */
export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ location, cause }) => {
    if (typeof window === "undefined" || cause !== "enter") return;
    const user = await getSessionUser();
    if (!user) {
      throw redirect({ href: signInUrlFor(location.pathname, location.searchStr) });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <QueryProvider>
      <Outlet />
    </QueryProvider>
  );
}
