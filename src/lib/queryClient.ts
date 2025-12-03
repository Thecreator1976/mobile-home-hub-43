import { QueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second

// Error handler for queries
const handleQueryError = (error: unknown) => {
  const message = error instanceof Error ? error.message : "An error occurred";
  
  // Only show toast for non-network errors (network errors are handled by retry)
  if (!isNetworkError(error)) {
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  }
};

// Check if error is a network error
const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.message.includes("fetch") ||
      error.message.includes("network") ||
      error.message.includes("ECONNREFUSED") ||
      error.name === "TypeError"
    );
  }
  return false;
};

// Retry delay with exponential backoff
const getRetryDelay = (attemptIndex: number): number => {
  return Math.min(RETRY_DELAY_BASE * 2 ** attemptIndex, 30000);
};

// Should retry query
const shouldRetry = (failureCount: number, error: unknown): boolean => {
  // Don't retry on auth errors
  if (error instanceof Error) {
    if (
      error.message.includes("401") ||
      error.message.includes("403") ||
      error.message.includes("not authenticated")
    ) {
      return false;
    }
  }
  
  return failureCount < MAX_RETRIES;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: shouldRetry,
      retryDelay: getRetryDelay,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount, error) => {
        // Only retry network errors for mutations
        return isNetworkError(error) && failureCount < 2;
      },
      onError: handleQueryError,
    },
  },
});

// Export utilities for custom retry handling
export { isNetworkError, shouldRetry, getRetryDelay };
