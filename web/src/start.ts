import {
  sentryGlobalFunctionMiddleware,
  sentryGlobalRequestMiddleware,
} from "@sentry/tanstackstart-react";
import { createStart } from "@tanstack/react-start";

import { authRequestMiddleware } from "@/lib/auth/auth-middleware";

// Sentry first so it sees every error, including auth middleware failures.
export const startInstance = createStart(() => ({
  requestMiddleware: [sentryGlobalRequestMiddleware, authRequestMiddleware],
  functionMiddleware: [sentryGlobalFunctionMiddleware],
}));
