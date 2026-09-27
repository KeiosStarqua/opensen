import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },

  // Browser events are tunneled through the Next.js app. On production that
  // endpoint is https://opensen.taquangkhoi.com/monitoring (see tunnelRoute).
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  environment: process.env.NODE_ENV,
  tracePropagationTargets: [
    /^https?:\/\/localhost(?::\d+)?/,
    /^https:\/\/api\.opensen\.taquangkhoi\.com/,
    /^https:\/\/opensen\.taquangkhoi\.com/,
    /^\//,
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
