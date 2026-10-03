import * as Sentry from "@sentry/tanstackstart-react";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below.
    // https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  environment: process.env.NODE_ENV,
  includeLocalVariables: true,
});
