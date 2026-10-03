import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { OneDollarStatsAnalytics } from "@/components/onedollarstats-analytics";
import { defaultTitle } from "@/lib/page-title";
import { siteConfig } from "@/lib/site";
import appCss from "@/styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: defaultTitle },
      { name: "description", content: siteConfig.description },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { rel: "icon", href: "/icon.png", sizes: "192x192", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-full flex flex-col">
        <OneDollarStatsAnalytics />
        {children}
        <Scripts />
      </body>
    </html>
  );
}
