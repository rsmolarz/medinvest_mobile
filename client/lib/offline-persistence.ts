/**
 * Offline Persistence
 * React Query persistence with AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import {
  persistQueryClient,
  PersistQueryClientProvider,
  PersistedClient,
  Persister,
} from '@tanstack/react-query-persist-client';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

// Storage key for persisted cache
const CACHE_KEY = 'MEDINVEST_QUERY_CACHE';
const CACHE_VERSION = 1;

/**
 * Create AsyncStorage persister for React Query
 */
export function createAsyncStoragePersister(): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      try {
        const data = JSON.stringify({
          version: CACHE_VERSION,
          timestamp: Date.now(),
          client,
        });
        await AsyncStorage.setItem(CACHE_KEY, data);
      } catch (error) {
        console.error('[Persistence] Failed to persist cache:', error);
      }
    },
    
    restoreClient: async () => {
      try {
        const data = await AsyncStorage.getItem(CACHE_KEY);
        if (!data) return undefined;

        const parsed = JSON.parse(data);
        
        // Check version compatibility
        if (parsed.version !== CACHE_VERSION) {
          await AsyncStorage.removeItem(CACHE_KEY);
          return undefined;
        }

        // Check if cache is too old (7 days)
        const maxAge = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - parsed.timestamp > maxAge) {
          await AsyncStorage.removeItem(CACHE_KEY);
          return undefined;
        }

        return parsed.client;
      } catch (error) {
        console.error('[Persistence] Failed to restore cache:', error);
        return undefined;
      }
    },
    
    removeClient: async () => {
      try {
        await AsyncStorage.removeItem(CACHE_KEY);
      } catch (error) {
        console.error('[Persistence] Failed to remove cache:', error);
      }
    },
  };
}

/**
 * Configure query client with offline support
 */
export function createOfflineQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Keep data fresh for 5 minutes
        staleTime: 5 * 60 * 1000,
        
        // Cache data for 24 hours
        gcTime: 24 * 60 * 60 * 1000,
        
        // Retry configuration
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          return failureCount < 3;
        },
        
        // Network mode
        networkMode: 'offlineFirst',
        
        // Refetch on reconnect
        refetchOnReconnect: true,
      },
      mutations: {
        // Retry mutations on network errors
        retry: (failureCount, error: any) => {
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          return failureCount < 2;
        },
        
        networkMode: 'offlineFirst',
      },
    },
  });
}

/**
 * Setup persistence for query client
 */
export async function setupQueryPersistence(queryClient: QueryClient): Promise<void> {
  const persister = createAsyncStoragePersister();

  await persistQueryClient({
    queryClient,
    persister,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    buster: CACHE_VERSION.toString(),
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => {
        // Only persist successful queries
        if (query.state.status !== 'success') return false;
        
        // Don't persist sensitive data
        const key = query.queryKey[0] as string;
        const sensitiveKeys = ['auth', 'session', 'token'];
        if (sensitiveKeys.includes(key)) return false;
        
        return true;
      },
    },
  });
}

/**
 * Network connectivity manager
 */
class NetworkManager {
  private isConnected: boolean = true;
  private listeners: Set<(isConnected: boolean) => void> = new Set();
  private unsubscribe: (() => void) | null = null;

  /**
   * Start monitoring network connectivity
   */
  startMonitoring(): void {
    this.unsubscribe = NetInfo.addEventListener(this.handleConnectivityChange);
    
    // Check initial state
    NetInfo.fetch().then(this.handleConnectivityChange);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  /**
   * Handle connectivity changes
   */
  private handleConnectivityChange = (state: NetInfoState): void => {
    const wasConnected = this.isConnected;
    this.isConnected = state.isConnected ?? false;

    if (wasConnected !== this.isConnected) {
      console.log('[Network]', this.isConnected ? 'Connected' : 'Disconnected');
      this.notifyListeners();
    }
  };

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      listener(this.isConnected);
    });
  }

  /**
   * Subscribe to connectivity changes
   */
  subscribe(listener: (isConnected: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Check if currently connected
   */
  getIsConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Wait for connection
   */
  async waitForConnection(timeoutMs: number = 30000): Promise<boolean> {
    if (this.isConnected) return true;

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeoutMs);

      const unsubscribe = this.subscribe((connected) => {
        if (connected) {
          clearTimeout(timeout);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }
}

export const networkManager = new NetworkManager();

/**
 * Offline mutation queue for background sync
 */
interface QueuedMutation {
  id: string;
  mutationKey: string;
  variables: unknown;
  timestamp: number;
  retries: number;
}

class OfflineMutationQueue {
  private queue: QueuedMutation[] = [];
  private storageKey = 'MEDINVEST_MUTATION_QUEUE';
  private isProcessing = false;

  /**
   * Load queue from storage
   */
  async load(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.storageKey);
      if (data) {
        this.queue = JSON.parse(data);
      }
    } catch (error) {
      console.error('[MutationQueue] Failed to load:', error);
    }
  }

  /**
   * Save queue to storage
   */
  private async save(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.error('[MutationQueue] Failed to save:', error);
    }
  }

  /**
   * Add mutation to queue
   */
  async add(mutationKey: string, variables: unknown): Promise<string> {
    const mutation: QueuedMutation = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      mutationKey,
      variables,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(mutation);
    await this.save();

    return mutation.id;
  }

  /**
   * Remove mutation from queue
   */
  async remove(id: string): Promise<void> {
    this.queue = this.queue.filter((m) => m.id !== id);
    await this.save();
  }

  /**
   * Process queued mutations
   */
  async process(
    executor: (mutationKey: string, variables: unknown) => Promise<void>
  ): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    if (!networkManager.getIsConnected()) return;

    this.isProcessing = true;

    const pending = [...this.queue];

    for (const mutation of pending) {
      try {
        await executor(mutation.mutationKey, mutation.variables);
        await this.remove(mutation.id);
      } catch (error) {
        mutation.retries += 1;
        
        // Remove after 3 retries
        if (mutation.retries >= 3) {
          await this.remove(mutation.id);
          console.error('[MutationQueue] Mutation failed after 3 retries:', mutation);
        }
      }
    }

    await this.save();
    this.isProcessing = false;
  }

  /**
   * Get queue length
   */
  getLength(): number {
    return this.queue.length;
  }

  /**
   * Clear queue
   */
  async clear(): Promise<void> {
    this.queue = [];
    await this.save();
  }
}

export const offlineMutationQueue = new OfflineMutationQueue();

// Export provider components
export { PersistQueryClientProvider };
