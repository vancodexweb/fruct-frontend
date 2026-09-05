"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/ui/toast/ToastProvider";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // CRM records change on the order of seconds-to-minutes, not
            // continuously: 30s keeps navigation snappy (cached data reused
            // instantly) without showing visibly stale data for long.
            // Individual queries override this where it matters (catalog
            // reference data goes longer, analytics goes a bit longer too).
            staleTime: 30_000,
            // Keep unused query results around briefly so switching tabs or
            // navigating back doesn't refetch instantly, without holding
            // onto memory indefinitely.
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
