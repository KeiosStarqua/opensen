import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  widenClientFileUpload: true,

  // Browser SDK posts to this path on the app origin.
  // Production endpoint: https://opensen.taquangkhoi.com/monitoring
  tunnelRoute: "/monitoring",

  silent: !process.env.CI,
});
