import {
  addIntegration,
  tanstackRouterBrowserTracingIntegration,
} from "@sentry/tanstackstart-react";
import { createRouter } from "@tanstack/react-router";

import { NotFoundPage } from "@/components/not-found-page";
import { RouteError } from "@/components/route-error";
import { parseSearch, stringifySearch } from "@/lib/routing/search";

import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultErrorComponent: RouteError,
    defaultNotFoundComponent: NotFoundPage,
    parseSearch,
    stringifySearch,
  });

  if (!router.isServer) {
    addIntegration(tanstackRouterBrowserTracingIntegration(router));
  }

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
