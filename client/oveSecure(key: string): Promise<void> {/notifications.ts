import { useEffect, useRef, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { apiClient } from '@/api/client';
import type { RootStackParamList } from '@/navigation/types';

const PUSH_TOKEN_KEY = '@medinvest/push_token';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Notification data types
 */
export interface NotificationData {
  type: 'investment_update' | 'portfolio_milestone' | 'new_opportunity' | 'article' | 'system';
  investmentId?: string;
  articleId?: string;
  url?: string;
}

/**
 * Register for push notifications
 */
export async function registerForPushNotifications(): Promise<string | null> {
  let token: string | null = null;

  // Must be a physical device
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  // Get Expo push token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    token = tokenData.data;

    // Store token locally
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

    // Send token to backend
    await apiClient.post('/users/me/push-token', { token });

    console.log('Push token registered:', token);
  } catch (error) {
    console.error('Failed to get push token:', error);
  }

  // Configure Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0066CC',
    });

    await Notifications.setNotificationChannelAsync('investments', {
      name: 'Investment Updates',
      importance: Notifications.AndroidImportance.HIGH,
      description: 'Updates about your investments',
    });

    await Notifications.setNotificationChannelAsync('opportunities', {
      name: 'New Opportunities',
      importance: Notifications.AndroidImportance.DEFAULT,
      description: 'New investment opportunities',
    });
  }

  return token;
}

/**
 * Unregister push notifications
 */
export async function unregisterPushNotifications(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    
    if (token) {
      // Remove token from backend
      await apiClient.delete('/users/me/push-token', { data: { token } });
      
      // Remove local token
      await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
    }
  } catch (error) {
    console.error('Failed to unregister push token:', error);
  }
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
  await setBadgeCount(0);
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification({
  title,
  body,
  data,
  trigger,
}: {
  title: string;
  body: string;
  data?: NotificationData;
  trigger?: Notifications.NotificationTriggerInput;
}): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
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
 * Hook for handling push notifications
 */
export function usePushNotifications() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as NotificationData;

      if (!data?.type) return;

      // Navigate based on notification type
      switch (data.type) {
        case 'investment_update':
        case 'new_opportunity':
          if (data.investmentId) {
            navigation.navigate('InvestmentDetail', {
              investmentId: data.investmentId,
            });
          }
          break;

        case 'portfolio_milestone':
          navigation.navigate('Main', { screen: 'Portfolio' } as any);
          break;

        case 'article':
          if (data.articleId) {
            // Navigate to article detail when implemented
            navigation.navigate('Main', { screen: 'Research' } as any);
          }
          break;

        case 'system':
        default:
          // Show alert for system notifications
          break;
      }
    },
    [navigation]
  );

  useEffect(() => {
    // Register for push notifications
    registerForPushNotifications();

    // Listen for incoming notifications while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    // Listen for user interaction with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    // Check if app was opened from a notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationResponse(response);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [handleNotificationResponse]);

  return {
    registerForPushNotifications,
    unregisterPushNotifications,
    clearAllNotifications,
    scheduleLocalNotification,
  };
}

/**
 * Notification preferences hook
 */
export function useNotificationPreferences() {
  const getPreferences = useCallback(async () => {
    try {
      const response = await apiClient.get('/users/me/notification-preferences');
      return response.data;
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      return null;
    }
  }, []);

  const updatePreferences = useCallback(
    async (preferences: {
      investmentUpdates?: boolean;
      newOpportunities?: boolean;
      portfolioMilestones?: boolean;
      articles?: boolean;
      marketing?: boolean;
    }) => {
      try {
        const response = await apiClient.patch(
          '/users/me/notification-preferences',
          preferences
        );
        return response.data;
      } catch (error) {
        console.error('Failed to update notification preferences:', error);
        throw error;
      }
    },
    []
  );

  return {
    getPreferences,
    updatePreferences,
  };
}
