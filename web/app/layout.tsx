import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { OneDollarStatsAnalytics } from "@/components/onedollarstats-analytics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "OpenSen — Real sentences for real life",
    template: "%s · OpenSen",
  },
  description:
    "OpenSen helps kids and beginners learn languages through real situations, fun stories, and interactive conversations — not just isolated words.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <OneDollarStatsAnalytics />
        {children}
      </body>
    </html>
  );
}
