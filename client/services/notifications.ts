import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { apiClient } from '@/api/client';
import type { RootStackParamList } from '@/navigation/types';

const PUSH_TOKEN_KEY = '@medinvest/push_token';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  type: 'investment_update' | 'portfolio_milestone' | 'new_opportunity' | 'article' | 'system';
  investmentId?: string;
  articleId?: string;
  url?: string;
  [key: string]: unknown;
}

export async function registerForPushNotifications(): Promise<string | null> {
  let token: string | null = null;

  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    token = tokenData.data;

    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

    try {
      await apiClient.post('/users/me/push-token', { token });
    } catch (e) {
      console.log('Backend not available for push token registration');
    }

    console.log('Push token registered:', token);
  } catch (error) {
    console.error('Failed to get push token:', error);
  }

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

export async function unregisterPushNotifications(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    
    if (token) {
      try {
        await apiClient.delete('/users/me/push-token');
      } catch (e) {
        console.log('Backend not available for push token removal');
      }
      
      await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
    }
  } catch (error) {
    console.error('Failed to unregister push token:', error);
  }
}

export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
  await setBadgeCount(0);
}

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
      data: data as Record<string, unknown>,
      sound: true,
    },
    trigger: trigger || null,
  });
}

export function usePushNotifications() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as NotificationData | undefined;

      if (!data?.type) return;

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
            navigation.navigate('Main', { screen: 'Research' } as any);
          }
          break;

        case 'system':
        default:
          break;
      }
    },
    [navigation]
  );

  useEffect(() => {
    registerForPushNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationResponse(response);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
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
