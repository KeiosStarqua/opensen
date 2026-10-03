// Vercel runs the Nitro function without `node --import`, so Sentry server
// init is imported first here (Sentry's "without --import" setup).
import "../instrument.server.mjs";

import { wrapFetchWithSentry } from "@sentry/tanstackstart-react";
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

export default createServerEntry(
  wrapFetchWithSentry({
    fetch(request: Request) {
      return handler.fetch(request);
    },
  }),
);
