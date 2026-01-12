/**
 * iOS Widgets Configuration
 * Home screen widgets for portfolio stats, notifications, and quick actions
 * 
 * Note: This file provides the React Native side configuration.
 * Actual widget implementation requires native Swift code in the iOS project.
 */

import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Widget data types
export interface PortfolioWidgetData {
  totalValue: number;
  totalReturn: number;
  returnPercentage: number;
  topHolding?: {
    name: string;
    value: number;
    change: number;
  };
  lastUpdated: string;
}

export interface NotificationsWidgetData {
  unreadCount: number;
  recentNotifications: Array<{
    id: string;
    type: string;
    title: string;
    body: string;
    timestamp: string;
  }>;
  lastUpdated: string;
}

export interface QuickStatsWidgetData {
  postsToday: number;
  newFollowers: number;
  unreadMessages: number;
  pendingDeals: number;
  lastUpdated: string;
}

export interface TrendingWidgetData {
  topics: Array<{
    tag: string;
    postCount: number;
  }>;
  lastUpdated: string;
}

// Widget identifiers
export const WIDGET_KINDS = {
  PORTFOLIO_SMALL: 'PortfolioWidgetSmall',
  PORTFOLIO_MEDIUM: 'PortfolioWidgetMedium',
  NOTIFICATIONS: 'NotificationsWidget',
  QUICK_STATS: 'QuickStatsWidget',
  TRENDING: 'TrendingWidget',
} as const;

// Storage keys for widget data
const WIDGET_DATA_KEYS = {
  PORTFOLIO: 'widget_data_portfolio',
  NOTIFICATIONS: 'widget_data_notifications',
  QUICK_STATS: 'widget_data_quick_stats',
  TRENDING: 'widget_data_trending',
};

// App Group identifier for sharing data with widgets
const APP_GROUP_ID = 'group.com.medinvest.app';

/**
 * iOS Widgets Service
 * Manages data sharing between the app and iOS widgets
 */
class WidgetsService {
  private isIOS = Platform.OS === 'ios';

  /**
   * Update portfolio widget data
   */
  async updatePortfolioWidget(data: PortfolioWidgetData): Promise<void> {
    if (!this.isIOS) return;

    try {
      const widgetData = {
        ...data,
        lastUpdated: new Date().toISOString(),
      };

      // Store in AsyncStorage for app use
      await AsyncStorage.setItem(
        WIDGET_DATA_KEYS.PORTFOLIO,
        JSON.stringify(widgetData)
      );

      // Store in shared App Group for widget access
      await this.writeToAppGroup('portfolio', widgetData);

      // Request widget refresh
      await this.reloadWidgets([WIDGET_KINDS.PORTFOLIO_SMALL, WIDGET_KINDS.PORTFOLIO_MEDIUM]);
    } catch (error) {
      console.error('[Widgets] Error updating portfolio widget:', error);
    }
  }

  /**
   * Update notifications widget data
   */
  async updateNotificationsWidget(data: NotificationsWidgetData): Promise<void> {
    if (!this.isIOS) return;

    try {
      const widgetData = {
        ...data,
        lastUpdated: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        WIDGET_DATA_KEYS.NOTIFICATIONS,
        JSON.stringify(widgetData)
      );

      await this.writeToAppGroup('notifications', widgetData);
      await this.reloadWidgets([WIDGET_KINDS.NOTIFICATIONS]);
    } catch (error) {
      console.error('[Widgets] Error updating notifications widget:', error);
    }
  }

  /**
   * Update quick stats widget data
   */
  async updateQuickStatsWidget(data: QuickStatsWidgetData): Promise<void> {
    if (!this.isIOS) return;

    try {
      const widgetData = {
        ...data,
        lastUpdated: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        WIDGET_DATA_KEYS.QUICK_STATS,
        JSON.stringify(widgetData)
      );

      await this.writeToAppGroup('quickStats', widgetData);
      await this.reloadWidgets([WIDGET_KINDS.QUICK_STATS]);
    } catch (error) {
      console.error('[Widgets] Error updating quick stats widget:', error);
    }
  }

  /**
   * Update trending widget data
   */
  async updateTrendingWidget(data: TrendingWidgetData): Promise<void> {
    if (!this.isIOS) return;

    try {
      const widgetData = {
        ...data,
        lastUpdated: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        WIDGET_DATA_KEYS.TRENDING,
        JSON.stringify(widgetData)
      );

      await this.writeToAppGroup('trending', widgetData);
      await this.reloadWidgets([WIDGET_KINDS.TRENDING]);
    } catch (error) {
      console.error('[Widgets] Error updating trending widget:', error);
    }
  }

  /**
   * Update all widgets at once
   */
  async updateAllWidgets(data: {
    portfolio?: PortfolioWidgetData;
    notifications?: NotificationsWidgetData;
    quickStats?: QuickStatsWidgetData;
    trending?: TrendingWidgetData;
  }): Promise<void> {
    const updates: Promise<void>[] = [];

    if (data.portfolio) {
      updates.push(this.updatePortfolioWidget(data.portfolio));
    }
    if (data.notifications) {
      updates.push(this.updateNotificationsWidget(data.notifications));
    }
    if (data.quickStats) {
      updates.push(this.updateQuickStatsWidget(data.quickStats));
    }
    if (data.trending) {
      updates.push(this.updateTrendingWidget(data.trending));
    }

    await Promise.all(updates);
  }

  /**
   * Write data to shared App Group container
   * This allows iOS widgets to access the data
   */
  private async writeToAppGroup(key: string, data: any): Promise<void> {
    try {
      // Use native module to write to App Group
      if (NativeModules.WidgetKit) {
        await NativeModules.WidgetKit.setItem(key, JSON.stringify(data), APP_GROUP_ID);
      }
    } catch (error) {
      // Fallback: Native module not available
      console.log('[Widgets] WidgetKit native module not available');
    }
  }

  /**
   * Request iOS to reload specific widgets
   */
  private async reloadWidgets(kinds: string[]): Promise<void> {
    try {
      if (NativeModules.WidgetKit) {
        await NativeModules.WidgetKit.reloadTimelines(kinds);
      }
    } catch (error) {
      console.log('[Widgets] Could not reload widgets');
    }
  }

  /**
   * Reload all widgets
   */
  async reloadAllWidgets(): Promise<void> {
    try {
      if (NativeModules.WidgetKit) {
        await NativeModules.WidgetKit.reloadAllTimelines();
      }
    } catch (error) {
      console.log('[Widgets] Could not reload all widgets');
    }
  }

  /**
   * Get cached widget data
   */
  async getCachedPortfolioData(): Promise<PortfolioWidgetData | null> {
    try {
      const data = await AsyncStorage.getItem(WIDGET_DATA_KEYS.PORTFOLIO);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Clear all widget data (e.g., on logout)
   */
  async clearAllWidgetData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(WIDGET_DATA_KEYS.PORTFOLIO),
        AsyncStorage.removeItem(WIDGET_DATA_KEYS.NOTIFICATIONS),
        AsyncStorage.removeItem(WIDGET_DATA_KEYS.QUICK_STATS),
        AsyncStorage.removeItem(WIDGET_DATA_KEYS.TRENDING),
      ]);

      // Clear App Group data
      if (NativeModules.WidgetKit) {
        await NativeModules.WidgetKit.clearAllData(APP_GROUP_ID);
      }

      // Reload widgets to show empty/logged out state
      await this.reloadAllWidgets();
    } catch (error) {
      console.error('[Widgets] Error clearing widget data:', error);
    }
  }
}

export const widgetsService = new WidgetsService();

/**
 * Hook to sync widget data when app data changes
 */
export function useWidgetSync() {
  const syncPortfolio = async (portfolioData: any) => {
    if (!portfolioData) return;

    await widgetsService.updatePortfolioWidget({
      totalValue: portfolioData.totalValue || 0,
      totalReturn: portfolioData.totalReturn || 0,
      returnPercentage: portfolioData.returnPercentage || 0,
      topHolding: portfolioData.holdings?.[0],
      lastUpdated: new Date().toISOString(),
    });
  };

  const syncNotifications = async (notifications: any[], unreadCount: number) => {
    await widgetsService.updateNotificationsWidget({
      unreadCount,
      recentNotifications: notifications.slice(0, 5).map(n => ({
        id: n.id,
        type: n.type,
        title: n.title || '',
        body: n.body || '',
        timestamp: n.created_at,
      })),
      lastUpdated: new Date().toISOString(),
    });
  };

  const syncQuickStats = async (stats: {
    postsToday?: number;
    newFollowers?: number;
    unreadMessages?: number;
    pendingDeals?: number;
  }) => {
    await widgetsService.updateQuickStatsWidget({
      postsToday: stats.postsToday || 0,
      newFollowers: stats.newFollowers || 0,
      unreadMessages: stats.unreadMessages || 0,
      pendingDeals: stats.pendingDeals || 0,
      lastUpdated: new Date().toISOString(),
    });
  };

  const clearOnLogout = async () => {
    await widgetsService.clearAllWidgetData();
  };

  return {
    syncPortfolio,
    syncNotifications,
    syncQuickStats,
    clearOnLogout,
    reloadAll: () => widgetsService.reloadAllWidgets(),
  };
}

// Widget deep link handlers
export const WIDGET_DEEP_LINKS = {
  PORTFOLIO: 'medinvest://portfolio',
  NOTIFICATIONS: 'medinvest://notifications',
  NEW_POST: 'medinvest://post/new',
  MESSAGES: 'medinvest://messages',
  SEARCH: 'medinvest://search',
  TRENDING: 'medinvest://trending',
};
