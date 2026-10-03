import { createFileRoute } from "@tanstack/react-router";

import { LandingPage } from "@/components/landing-page";
import { QueryProvider } from "@/lib/query/query-provider";

export const Route = createFileRoute("/")({
  component: MarketingHome,
});

/**
 * Landing page. Its own `QueryProvider` lets the CTA read onboarding status;
 * that cache is separate from the signed-in app cache under `_app`.
 */
function MarketingHome() {
  return (
    <QueryProvider>
      <div className="font-studio">
        <LandingPage />
      </div>
    </QueryProvider>
  );
}
