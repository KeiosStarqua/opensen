"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createContext, useContext, useState } from "react";

import { createDefaultApiClient, type ApiClient } from "@/lib/api/client";

import { createQueryClient } from "./query-client";

const ApiClientContext = createContext<ApiClient | null>(null);

/**
 * Server-state root for the signed-in app: one `QueryClient` and one API
 * client per mount. Devtools render only in development builds.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  const [apiClient] = useState(() => createDefaultApiClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ApiClientContext.Provider value={apiClient}>
        {children}
      </ApiClientContext.Provider>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}

/** The shared API client. Must be called under `QueryProvider`. */
export function useApiClient(): ApiClient {
  const client = useContext(ApiClientContext);
  if (!client) {
    throw new Error("useApiClient must be used inside <QueryProvider>.");
  }
  return client;
}
