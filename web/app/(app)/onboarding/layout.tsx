import { Nunito } from "next/font/google";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-nunito",
});

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${nunito.variable} font-studio min-h-full bg-sen-cream text-sen-ink`}>
      {children}
    </div>
  );
}
