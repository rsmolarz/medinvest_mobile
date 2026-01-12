/**
 * App Shortcuts (3D Touch / Haptic Touch Quick Actions)
 * Quick actions from home screen icon press
 */

import { Platform, NativeModules, Linking } from 'react-native';
import { useEffect, useCallback } from 'react';

// Shortcut types
export interface AppShortcut {
  type: string;
  title: string;
  subtitle?: string;
  iconName?: string; // SF Symbol name for iOS
  userInfo?: Record<string, any>;
}

// Predefined shortcuts
export const APP_SHORTCUTS = {
  NEW_POST: {
    type: 'com.medinvest.newpost',
    title: 'New Post',
    subtitle: 'Create a new post',
    iconName: 'square.and.pencil',
  },
  SEARCH: {
    type: 'com.medinvest.search',
    title: 'Search',
    subtitle: 'Search posts and users',
    iconName: 'magnifyingglass',
  },
  MESSAGES: {
    type: 'com.medinvest.messages',
    title: 'Messages',
    subtitle: 'View your messages',
    iconName: 'message.fill',
  },
  NOTIFICATIONS: {
    type: 'com.medinvest.notifications',
    title: 'Notifications',
    subtitle: 'View notifications',
    iconName: 'bell.fill',
  },
  AI_CHAT: {
    type: 'com.medinvest.aichat',
    title: 'Ask AI',
    subtitle: 'Chat with MedInvest AI',
    iconName: 'sparkles',
  },
} as const;

export type ShortcutType = keyof typeof APP_SHORTCUTS;

/**
 * App Shortcuts Service
 */
class AppShortcutsService {
  private isIOS = Platform.OS === 'ios';
  private pendingShortcut: string | null = null;
  private shortcutHandlers: Map<string, () => void> = new Map();

  /**
   * Initialize shortcuts on app start
   */
  async initialize(): Promise<void> {
    if (!this.isIOS) return;

    try {
      // Set up default shortcuts
      await this.setShortcuts([
        APP_SHORTCUTS.NEW_POST,
        APP_SHORTCUTS.SEARCH,
        APP_SHORTCUTS.MESSAGES,
        APP_SHORTCUTS.NOTIFICATIONS,
      ]);

      // Check for pending shortcut from cold start
      await this.checkPendingShortcut();
    } catch (error) {
      console.error('[AppShortcuts] Error initializing:', error);
    }
  }

  /**
   * Set the available shortcuts
   */
  async setShortcuts(shortcuts: AppShortcut[]): Promise<void> {
    if (!this.isIOS) return;

    try {
      if (NativeModules.QuickActions) {
        await NativeModules.QuickActions.setShortcuts(shortcuts);
      }
    } catch (error) {
      console.log('[AppShortcuts] QuickActions native module not available');
    }
  }

  /**
   * Add a dynamic shortcut
   */
  async addShortcut(shortcut: AppShortcut): Promise<void> {
    if (!this.isIOS) return;

    try {
      if (NativeModules.QuickActions) {
        await NativeModules.QuickActions.addShortcut(shortcut);
      }
    } catch (error) {
      console.log('[AppShortcuts] Could not add shortcut');
    }
  }

  /**
   * Remove a shortcut
   */
  async removeShortcut(type: string): Promise<void> {
    if (!this.isIOS) return;

    try {
      if (NativeModules.QuickActions) {
        await NativeModules.QuickActions.removeShortcut(type);
      }
    } catch (error) {
      console.log('[AppShortcuts] Could not remove shortcut');
    }
  }

  /**
   * Clear all shortcuts
   */
  async clearAllShortcuts(): Promise<void> {
    if (!this.isIOS) return;

    try {
      if (NativeModules.QuickActions) {
        await NativeModules.QuickActions.clearShortcuts();
      }
    } catch (error) {
      console.log('[AppShortcuts] Could not clear shortcuts');
    }
  }

  /**
   * Check for pending shortcut (from cold start)
   */
  async checkPendingShortcut(): Promise<string | null> {
    if (!this.isIOS) return null;

    try {
      if (NativeModules.QuickActions) {
        const shortcut = await NativeModules.QuickActions.getPendingShortcut();
        if (shortcut) {
          this.pendingShortcut = shortcut;
          return shortcut;
        }
      }
    } catch (error) {
      console.log('[AppShortcuts] Could not get pending shortcut');
    }
    return null;
  }

  /**
   * Get and clear pending shortcut
   */
  consumePendingShortcut(): string | null {
    const shortcut = this.pendingShortcut;
    this.pendingShortcut = null;
    return shortcut;
  }

  /**
   * Register a handler for a shortcut type
   */
  registerHandler(type: string, handler: () => void): () => void {
    this.shortcutHandlers.set(type, handler);
    return () => this.shortcutHandlers.delete(type);
  }

  /**
   * Handle a shortcut action
   */
  handleShortcut(type: string): void {
    const handler = this.shortcutHandlers.get(type);
    if (handler) {
      handler();
    } else {
      console.log('[AppShortcuts] No handler for shortcut:', type);
    }
  }

  /**
   * Update shortcuts based on user state
   */
  async updateShortcutsForUser(user: { isPremium?: boolean; hasUnread?: boolean }): Promise<void> {
    const shortcuts: AppShortcut[] = [
      APP_SHORTCUTS.NEW_POST,
      APP_SHORTCUTS.SEARCH,
      APP_SHORTCUTS.MESSAGES,
    ];

    // Add AI chat for premium users
    if (user.isPremium) {
      shortcuts.push(APP_SHORTCUTS.AI_CHAT);
    }

    // Add notifications with badge if unread
    if (user.hasUnread) {
      shortcuts.push({
        ...APP_SHORTCUTS.NOTIFICATIONS,
        subtitle: 'You have new notifications',
      });
    } else {
      shortcuts.push(APP_SHORTCUTS.NOTIFICATIONS);
    }

    await this.setShortcuts(shortcuts);
  }

  /**
   * Map shortcut type to navigation route
   */
  getRouteForShortcut(type: string): { screen: string; params?: any } | null {
    switch (type) {
      case APP_SHORTCUTS.NEW_POST.type:
        return { screen: 'CreatePost' };
      case APP_SHORTCUTS.SEARCH.type:
        return { screen: 'Search' };
      case APP_SHORTCUTS.MESSAGES.type:
        return { screen: 'Messages' };
      case APP_SHORTCUTS.NOTIFICATIONS.type:
        return { screen: 'Notifications' };
      case APP_SHORTCUTS.AI_CHAT.type:
        return { screen: 'AIChat' };
      default:
        return null;
    }
  }
}

export const appShortcutsService = new AppShortcutsService();

/**
 * Hook to handle app shortcuts
 */
export function useAppShortcuts(navigation: any) {
  // Handle shortcut navigation
  const handleShortcut = useCallback((type: string) => {
    const route = appShortcutsService.getRouteForShortcut(type);
    if (route) {
      navigation.navigate(route.screen, route.params);
    }
  }, [navigation]);

  // Initialize and check for pending shortcut
  useEffect(() => {
    const init = async () => {
      await appShortcutsService.initialize();
      
      // Handle pending shortcut from cold start
      const pending = appShortcutsService.consumePendingShortcut();
      if (pending) {
        // Delay to ensure navigation is ready
        setTimeout(() => handleShortcut(pending), 500);
      }
    };

    init();

    // Register handlers for all shortcuts
    const unsubscribers = Object.values(APP_SHORTCUTS).map(shortcut =>
      appShortcutsService.registerHandler(shortcut.type, () => handleShortcut(shortcut.type))
    );

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [handleShortcut]);

  return {
    handleShortcut,
    updateShortcuts: (user: any) => appShortcutsService.updateShortcutsForUser(user),
  };
}

/**
 * Android App Shortcuts (for completeness)
 * Android uses a different mechanism - shortcuts in AndroidManifest.xml
 * and ShortcutManager for dynamic shortcuts
 */
export const ANDROID_SHORTCUTS = `
<!-- Add to android/app/src/main/AndroidManifest.xml -->
<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">
    <shortcut
        android:shortcutId="new_post"
        android:enabled="true"
        android:icon="@drawable/ic_shortcut_post"
        android:shortcutShortLabel="@string/shortcut_new_post"
        android:shortcutLongLabel="@string/shortcut_new_post_long">
        <intent
            android:action="android.intent.action.VIEW"
            android:targetPackage="com.medinvest.app"
            android:targetClass="com.medinvest.app.MainActivity"
            android:data="medinvest://post/new" />
    </shortcut>
    <shortcut
        android:shortcutId="search"
        android:enabled="true"
        android:icon="@drawable/ic_shortcut_search"
        android:shortcutShortLabel="@string/shortcut_search"
        android:shortcutLongLabel="@string/shortcut_search_long">
        <intent
            android:action="android.intent.action.VIEW"
            android:targetPackage="com.medinvest.app"
            android:targetClass="com.medinvest.app.MainActivity"
            android:data="medinvest://search" />
    </shortcut>
    <shortcut
        android:shortcutId="messages"
        android:enabled="true"
        android:icon="@drawable/ic_shortcut_messages"
        android:shortcutShortLabel="@string/shortcut_messages"
        android:shortcutLongLabel="@string/shortcut_messages_long">
        <intent
            android:action="android.intent.action.VIEW"
            android:targetPackage="com.medinvest.app"
            android:targetClass="com.medinvest.app.MainActivity"
            android:data="medinvest://messages" />
    </shortcut>
</shortcuts>
`;
