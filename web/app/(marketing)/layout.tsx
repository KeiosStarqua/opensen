import { Caveat, Nunito } from "next/font/google";

import { QueryProvider } from "@/lib/query/query-provider";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-nunito",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-caveat",
});

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <div className={`${nunito.variable} ${caveat.variable} font-studio`}>
        {children}
      </div>
    </QueryProvider>
  );
}
