/**
 * Offline Queue Service
 * Queue actions when offline and sync when back online
 */

import { useEffect, useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

import { haptics } from '@/lib/haptics';
import { api } from '@/lib/api';

// Queue item types
export type QueuedActionType = 
  | 'create_post'
  | 'edit_post'
  | 'delete_post'
  | 'create_comment'
  | 'edit_comment'
  | 'delete_comment'
  | 'like'
  | 'unlike'
  | 'bookmark'
  | 'unbookmark'
  | 'follow'
  | 'unfollow'
  | 'send_message'
  | 'mark_read'
  | 'vote_poll';

// Queued action
export interface QueuedAction {
  id: string;
  type: QueuedActionType;
  payload: any;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
  priority: number; // Lower = higher priority
}

// Sync result
export interface SyncResult {
  success: boolean;
  actionId: string;
  error?: string;
}

// Storage key
const QUEUE_STORAGE_KEY = 'offline_action_queue';

// Action configurations
const ACTION_CONFIG: Record<QueuedActionType, { endpoint: string; method: string; priority: number }> = {
  create_post: { endpoint: '/posts', method: 'POST', priority: 1 },
  edit_post: { endpoint: '/posts/:id', method: 'PUT', priority: 2 },
  delete_post: { endpoint: '/posts/:id', method: 'DELETE', priority: 3 },
  create_comment: { endpoint: '/posts/:postId/comments', method: 'POST', priority: 1 },
  edit_comment: { endpoint: '/comments/:id', method: 'PUT', priority: 2 },
  delete_comment: { endpoint: '/comments/:id', method: 'DELETE', priority: 3 },
  like: { endpoint: '/posts/:id/like', method: 'POST', priority: 4 },
  unlike: { endpoint: '/posts/:id/like', method: 'DELETE', priority: 4 },
  bookmark: { endpoint: '/posts/:id/bookmark', method: 'POST', priority: 4 },
  unbookmark: { endpoint: '/posts/:id/bookmark', method: 'DELETE', priority: 4 },
  follow: { endpoint: '/users/:id/follow', method: 'POST', priority: 3 },
  unfollow: { endpoint: '/users/:id/follow', method: 'DELETE', priority: 3 },
  send_message: { endpoint: '/conversations/:id/messages', method: 'POST', priority: 1 },
  mark_read: { endpoint: '/conversations/:id/read', method: 'POST', priority: 5 },
  vote_poll: { endpoint: '/posts/:postId/polls/:pollId/vote', method: 'POST', priority: 2 },
};

/**
 * Offline Queue Service
 */
class OfflineQueueService {
  private queue: QueuedAction[] = [];
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private loaded: boolean = false;
  private listeners: Set<(queue: QueuedAction[]) => void> = new Set();
  private unsubscribeNetInfo: (() => void) | null = null;

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (this.loaded) return;

    // Load queue from storage
    await this.loadQueue();

    // Subscribe to network state
    this.unsubscribeNetInfo = NetInfo.addEventListener(this.handleNetworkChange);

    // Check initial network state
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? true;

    // Sync if online and have queued items
    if (this.isOnline && this.queue.length > 0) {
      this.syncQueue();
    }

    this.loaded = true;
  }

  /**
   * Handle network state changes
   */
  private handleNetworkChange = (state: NetInfoState) => {
    const wasOffline = !this.isOnline;
    this.isOnline = state.isConnected ?? true;

    // Came back online - sync queue
    if (wasOffline && this.isOnline && this.queue.length > 0) {
      console.log('[OfflineQueue] Back online, syncing queue...');
      this.syncQueue();
    }
  };

  /**
   * Load queue from storage
   */
  private async loadQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        this.notifyListeners();
      }
    } catch (error) {
      console.error('[OfflineQueue] Error loading queue:', error);
    }
  }

  /**
   * Save queue to storage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('[OfflineQueue] Error saving queue:', error);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add action to queue
   */
  async enqueue(type: QueuedActionType, payload: any): Promise<string> {
    const config = ACTION_CONFIG[type];
    
    const action: QueuedAction = {
      id: this.generateId(),
      type,
      payload,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 3,
      priority: config.priority,
    };

    // Add to queue sorted by priority
    this.queue.push(action);
    this.queue.sort((a, b) => a.priority - b.priority);

    await this.saveQueue();
    this.notifyListeners();

    console.log(`[OfflineQueue] Enqueued action: ${type}`, action.id);

    // Try to execute immediately if online
    if (this.isOnline && !this.isSyncing) {
      this.syncQueue();
    }

    return action.id;
  }

  /**
   * Remove action from queue
   */
  async dequeue(actionId: string): Promise<void> {
    this.queue = this.queue.filter(a => a.id !== actionId);
    await this.saveQueue();
    this.notifyListeners();
  }

  /**
   * Sync queue with server
   */
  async syncQueue(): Promise<SyncResult[]> {
    if (this.isSyncing || !this.isOnline || this.queue.length === 0) {
      return [];
    }

    this.isSyncing = true;
    const results: SyncResult[] = [];

    console.log(`[OfflineQueue] Syncing ${this.queue.length} actions...`);

    // Process queue in order
    const queueCopy = [...this.queue];

    for (const action of queueCopy) {
      const result = await this.executeAction(action);
      results.push(result);

      if (result.success) {
        await this.dequeue(action.id);
      } else if (action.retryCount >= action.maxRetries) {
        // Max retries reached, remove from queue
        console.warn(`[OfflineQueue] Max retries reached for action ${action.id}`);
        await this.dequeue(action.id);
      } else {
        // Increment retry count
        action.retryCount++;
        await this.saveQueue();
      }
    }

    this.isSyncing = false;

    if (results.some(r => r.success)) {
      haptics.success();
    }

    console.log(`[OfflineQueue] Sync complete. ${results.filter(r => r.success).length}/${results.length} successful`);

    return results;
  }

  /**
   * Execute a single queued action
   */
  private async executeAction(action: QueuedAction): Promise<SyncResult> {
    const config = ACTION_CONFIG[action.type];
    
    try {
      // Build endpoint with params
      let endpoint = config.endpoint;
      const payload = { ...action.payload };

      // Replace URL params
      endpoint = endpoint.replace(/:(\w+)/g, (_, key) => {
        const value = payload[key];
        delete payload[key];
        return value;
      });

      // Make request
      let response;
      switch (config.method) {
        case 'POST':
          response = await api.post(endpoint, payload);
          break;
        case 'PUT':
          response = await api.put(endpoint, payload);
          break;
        case 'DELETE':
          response = await api.delete(endpoint);
          break;
        default:
          throw new Error(`Unknown method: ${config.method}`);
      }

      console.log(`[OfflineQueue] Action ${action.id} executed successfully`);

      return {
        success: true,
        actionId: action.id,
      };
    } catch (error: any) {
      console.error(`[OfflineQueue] Action ${action.id} failed:`, error);

      return {
        success: false,
        actionId: action.id,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Get queue status
   */
  getQueueStatus(): { count: number; isOnline: boolean; isSyncing: boolean } {
    return {
      count: this.queue.length,
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
    };
  }

  /**
   * Get all queued actions
   */
  getQueue(): QueuedAction[] {
    return [...this.queue];
  }

  /**
   * Clear all queued actions
   */
  async clearQueue(): Promise<void> {
    this.queue = [];
    await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
    this.notifyListeners();
  }

  /**
   * Subscribe to queue changes
   */
  subscribe(listener: (queue: QueuedAction[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.queue]));
  }

  /**
   * Check if online
   */
  isNetworkOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
    }
  }
}

export const offlineQueueService = new OfflineQueueService();

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to manage offline queue
 */
export function useOfflineQueue() {
  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Initialize service
    offlineQueueService.initialize();

    // Subscribe to queue changes
    const unsubscribe = offlineQueueService.subscribe(setQueue);

    // Subscribe to network changes
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? true);
    });

    // Update initial state
    const status = offlineQueueService.getQueueStatus();
    setQueue(offlineQueueService.getQueue());
    setIsOnline(status.isOnline);
    setIsSyncing(status.isSyncing);

    return () => {
      unsubscribe();
      unsubscribeNetInfo();
    };
  }, []);

  const enqueue = useCallback(async (type: QueuedActionType, payload: any) => {
    return offlineQueueService.enqueue(type, payload);
  }, []);

  const syncNow = useCallback(async () => {
    setIsSyncing(true);
    const results = await offlineQueueService.syncQueue();
    setIsSyncing(false);
    return results;
  }, []);

  const clearQueue = useCallback(async () => {
    await offlineQueueService.clearQueue();
  }, []);

  return {
    queue,
    queueCount: queue.length,
    isOnline,
    isSyncing,
    enqueue,
    syncNow,
    clearQueue,
  };
}

/**
 * Hook for offline-aware actions
 * Automatically queues actions when offline
 */
export function useOfflineAction<T>(
  type: QueuedActionType,
  onlineAction: (payload: T) => Promise<any>,
  options?: {
    onQueued?: (actionId: string) => void;
    onSynced?: (result: any) => void;
    onError?: (error: any) => void;
  }
) {
  const { isOnline, enqueue } = useOfflineQueue();

  const execute = useCallback(async (payload: T) => {
    if (isOnline) {
      try {
        const result = await onlineAction(payload);
        options?.onSynced?.(result);
        return result;
      } catch (error) {
        options?.onError?.(error);
        throw error;
      }
    } else {
      // Offline - queue the action
      const actionId = await enqueue(type, payload);
      options?.onQueued?.(actionId);
      haptics.warning();
      return { queued: true, actionId };
    }
  }, [isOnline, type, onlineAction, enqueue, options]);

  return {
    execute,
    isOnline,
  };
}

// =============================================================================
// OFFLINE INDICATOR COMPONENT
// =============================================================================

import React, { memo } from 'react';
import { Animated, StyleSheet as RNStyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OfflineIndicatorProps {
  showQueueCount?: boolean;
}

export const OfflineIndicator = memo(function OfflineIndicator({
  showQueueCount = true,
}: OfflineIndicatorProps) {
  const { isOnline, queueCount } = useOfflineQueue();
  const translateY = React.useRef(new Animated.Value(-50)).current;

  React.useEffect(() => {
    Animated.spring(translateY, {
      toValue: isOnline ? -50 : 0,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [isOnline]);

  return (
    <Animated.View
      style={[
        offlineStyles.container,
        { transform: [{ translateY }] },
      ]}
    >
      <Ionicons name="cloud-offline-outline" size={16} color="white" />
      <ThemedText style={offlineStyles.text}>
        You're offline
        {showQueueCount && queueCount > 0 && ` • ${queueCount} pending`}
      </ThemedText>
    </Animated.View>
  );
});

import { ThemedText } from '@/components/ThemedText';

const offlineStyles = RNStyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.warning,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 1000,
  },
  text: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
});
