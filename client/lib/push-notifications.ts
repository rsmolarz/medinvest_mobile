/**
 * Push Notification Service
 * Handle push notification registration and handling
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { notificationsApi } from './api';
import { storage } from './storage';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationData {
  type: string;
  postId?: number;
  userId?: number;
  conversationId?: number;
  dealId?: number;
  amaId?: number;
}

class PushNotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;

  /**
   * Initialize push notifications
   */
  async initialize(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    // Check/request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    // Get push token
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID,
      });
      this.expoPushToken = tokenData.data;

      // Configure Android channel
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      return this.expoPushToken;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  /**
   * Setup Android notification channels
   */
  private async setupAndroidChannels(): Promise<void> {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1E88E5',
    });

    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('deals', {
      name: 'Investment Deals',
      importance: Notifications.AndroidImportance.DEFAULT,
    });

    await Notifications.setNotificationChannelAsync('social', {
      name: 'Social',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  /**
   * Register device token with backend
   */
  async registerToken(): Promise<boolean> {
    if (!this.expoPushToken) {
      await this.initialize();
    }

    if (!this.expoPushToken) {
      return false;
    }

    try {
      const response = await notificationsApi.registerPushToken({
        token: this.expoPushToken,
        platform: Platform.OS,
        deviceId: Device.modelId || 'unknown',
      });

      if (response.success) {
        await storage.set('pushTokenRegistered', 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to register push token:', error);
      return false;
    }
  }

  /**
   * Unregister device token (on logout)
   */
  async unregisterToken(): Promise<void> {
    if (!this.expoPushToken) return;

    try {
      await notificationsApi.unregisterPushToken(this.expoPushToken);
      await storage.remove('pushTokenRegistered');
    } catch (error) {
      console.error('Failed to unregister push token:', error);
    }
  }

  /**
   * Set up notification listeners
   */
  setupListeners(
    onNotificationReceived: (notification: Notifications.Notification) => void,
    onNotificationResponse: (response: Notifications.NotificationResponse) => void
  ): void {
    // Clean up existing listeners
    this.removeListeners();

    // Listen for incoming notifications while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      onNotificationReceived
    );

    // Listen for user interaction with notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      onNotificationResponse
    );
  }

  /**
   * Remove notification listeners
   */
  removeListeners(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }
  }

  /**
   * Get the last notification response (for cold start)
   */
  async getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
    return Notifications.getLastNotificationResponseAsync();
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: PushNotificationData,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    return Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: trigger || null,
    });
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllScheduledNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear badge
   */
  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  /**
   * Get current push token
   */
  getToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Parse notification data for navigation
   */
  parseNotificationData(data: Record<string, unknown>): PushNotificationData | null {
    if (!data || !data.type) return null;

    return {
      type: data.type as string,
      postId: data.postId as number | undefined,
      userId: data.userId as number | undefined,
      conversationId: data.conversationId as number | undefined,
      dealId: data.dealId as number | undefined,
      amaId: data.amaId as number | undefined,
    };
  }

  /**
   * Get navigation route from notification data
   */
  getNavigationRoute(data: PushNotificationData): { screen: string; params?: Record<string, unknown> } | null {
    switch (data.type) {
      case 'like':
      case 'comment':
      case 'mention':
      case 'reply':
        if (data.postId) {
          return { screen: 'PostDetail', params: { postId: data.postId } };
        }
        break;
      case 'follow':
        if (data.userId) {
          return { screen: 'UserProfile', params: { userId: data.userId } };
        }
        break;
      case 'message':
        if (data.userId) {
          return { screen: 'Conversation', params: { userId: data.userId } };
        }
        break;
      case 'deal_update':
        if (data.dealId) {
          return { screen: 'DealDetail', params: { dealId: data.dealId } };
        }
        break;
      case 'ama_live':
        if (data.amaId) {
          return { screen: 'AMADetail', params: { amaId: data.amaId } };
        }
        break;
      case 'achievement':
        return { screen: 'Achievements' };
      default:
        return { screen: 'Notifications' };
    }
    return null;
  }
}

export const pushNotificationService = new PushNotificationService();
