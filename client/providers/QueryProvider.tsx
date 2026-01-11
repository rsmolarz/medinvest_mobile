import React from 'react';
import {
  QueryClient,
  QueryClientProvider,
  onlineManager,
  focusManager,
  type QueryClientConfig,
} from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { AppState, type AppStateStatus, Platform } from 'react-native';

// ============================================
// Query Client Configuration
// ============================================

const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Stale time - how long data is considered fresh
      staleTime: 1000 * 60 * 5, // 5 minutes

      // Cache time - how long inactive data stays in cache
      gcTime: 1000 * 60 * 60 * 24, // 24 hours (was cacheTime)

      // Retry configuration
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch configuration
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,

      // Network mode - fetch only when online
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      retryDelay: 1000,
      networkMode: 'online',
    },
  },
};

// Create query client instance
export const queryClient = new QueryClient(queryClientConfig);

// ============================================
// Online Manager Setup
// ============================================

// Configure online status detection
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected && state.isInternetReachable !== false);
  });
});

// ============================================
// Focus Manager Setup
// ============================================

// Configure app focus detection
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

// ============================================
// Async Storage Persister
// ============================================

const CACHE_KEY = '@medinvest/react-query-cache';

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: CACHE_KEY,
  throttleTime: 1000, // Throttle writes to once per second
  serialize: JSON.stringify,
  deserialize: JSON.parse,
});

// ============================================
// Query Keys Factory
// ============================================

export const queryKeys = {
  // Investments
  investments: {
    all: ['investments'] as const,
    lists: () => [...queryKeys.investments.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.investments.lists(), filters] as const,
    details: () => [...queryKeys.investments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.investments.details(), id] as const,
    search: (query: string, filters?: Record<string, any>) =>
      [...queryKeys.investments.all, 'search', query, filters] as const,
  },

  // Portfolio
  portfolio: {
    all: ['portfolio'] as const,
    summary: () => [...queryKeys.portfolio.all, 'summary'] as const,
    investments: () => [...queryKeys.portfolio.all, 'investments'] as const,
    transactions: (filters?: Record<string, any>) =>
      [...queryKeys.portfolio.all, 'transactions', filters] as const,
  },

  // Articles
  articles: {
    all: ['articles'] as const,
    lists: () => [...queryKeys.articles.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.articles.lists(), filters] as const,
    details: () => [...queryKeys.articles.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.articles.details(), id] as const,
    bookmarked: () => [...queryKeys.articles.all, 'bookmarked'] as const,
  },

  // User
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    preferences: () => [...queryKeys.user.all, 'preferences'] as const,
    paymentMethods: () => [...queryKeys.user.all, 'payment-methods'] as const,
  },
};

// ============================================
// Provider Component
// ============================================

interface QueryProviderProps {
  children: React.ReactNode;
  /** Enable persistence to AsyncStorage */
  enablePersistence?: boolean;
}

export function QueryProvider({
  children,
  enablePersistence = true,
}: QueryProviderProps) {
  // Setup app state listener for focus management
  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  if (enablePersistence) {
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: asyncStoragePersister,
          maxAge: 1000 * 60 * 60 * 24, // 24 hours
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => {
              // Only persist successful queries
              return query.state.status === 'success';
            },
          },
        }}
        onSuccess={() => {
          // Resume any paused mutations after hydration
          queryClient.resumePausedMutations();
        }}
      >
        {children}
      </PersistQueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// ============================================
// Utility Functions
// ============================================

/**
 * Prefetch data for a route/screen
 */
export async function prefetchInvestment(id: string) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.investments.detail(id),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Invalidate all investment-related queries
 */
export function invalidateInvestments() {
  queryClient.invalidateQueries({ queryKey: queryKeys.investments.all });
}

/**
 * Invalidate portfolio queries
 */
export function invalidatePortfolio() {
  queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.all });
}

/**
 * Clear all cached data
 */
export async function clearQueryCache() {
  queryClient.clear();
  await AsyncStorage.removeItem(CACHE_KEY);
}

/**
 * Get current online status
 */
export function isOnline(): boolean {
  return onlineManager.isOnline();
}

export default QueryProvider;
