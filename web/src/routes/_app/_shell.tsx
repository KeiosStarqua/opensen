import { Outlet, createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { ThemeBootstrap } from "@/components/settings/theme-bootstrap";
import { StudioProvider } from "@/components/studio/studio-provider";
import { getSessionUser } from "@/lib/auth/auth.functions";

/** Study shell: sidebar / tab bar around the primary learner routes. */
export const Route = createFileRoute("/_app/_shell")({
  loader: () => getSessionUser(),
  component: ShellLayout,
});

function ShellLayout() {
  const user = Route.useLoaderData();

  return (
    <div className="font-studio h-dvh">
      <StudioProvider>
        <AppShell accountName={user?.name}>
          <ThemeBootstrap />
          <Outlet />
        </AppShell>
      </StudioProvider>
    </div>
  );
}
