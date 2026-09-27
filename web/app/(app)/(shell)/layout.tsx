import { AppShell } from "@/components/app-shell";
import { ThemeBootstrap } from "@/components/settings/theme-bootstrap";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <ThemeBootstrap />
      {children}
    </AppShell>
  );
}
