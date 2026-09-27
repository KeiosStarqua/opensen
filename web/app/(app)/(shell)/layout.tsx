import { Nunito } from "next/font/google";

import { AppShell } from "@/components/app-shell";
import { ThemeBootstrap } from "@/components/settings/theme-bootstrap";
import { StudioProvider } from "@/components/studio/studio-provider";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-nunito",
});

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${nunito.variable} font-studio h-dvh`}>
      <StudioProvider>
        <AppShell>
          <ThemeBootstrap />
          {children}
        </AppShell>
      </StudioProvider>
    </div>
  );
}
