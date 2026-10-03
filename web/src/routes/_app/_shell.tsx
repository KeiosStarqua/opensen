import { Outlet, createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { ThemeBootstrap } from "@/components/settings/theme-bootstrap";
import { StudioProvider } from "@/components/studio/studio-provider";

/** Study shell: sidebar / tab bar around the primary learner routes. */
export const Route = createFileRoute("/_app/_shell")({
  component: ShellLayout,
});

function ShellLayout() {
  return (
    <div className="font-studio h-dvh">
      <StudioProvider>
        <AppShell>
          <ThemeBootstrap />
          <Outlet />
        </AppShell>
      </StudioProvider>
    </div>
  );
}
