import { init } from "@sentry/tanstackstart-react";

init({
  dsn: import.meta.env.VITE_SENTRY_DSN,

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below.
    // https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },

  // Browser events tunnel through the app (src/routes/monitoring.ts).
  // On production that endpoint is https://opensen.taquangkhoi.com/monitoring.
  tunnel: "/monitoring",
  tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.1,
  environment: import.meta.env.MODE,
  tracePropagationTargets: [
    /^https?:\/\/localhost(?::\d+)?/,
    /^https:\/\/api\.opensen\.taquangkhoi\.com/,
    /^https:\/\/opensen\.taquangkhoi\.com/,
    /^\//,
  ],
});
