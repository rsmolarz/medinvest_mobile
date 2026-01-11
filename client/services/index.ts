export {
  registerForPushNotifications,
  unregisterPushNotifications,
  getBadgeCount,
  setBadgeCount,
  clearAllNotifications,
  scheduleLocalNotification,
  usePushNotifications,
  useNotificationPreferences,
  type NotificationData,
} from './notifications';

export {
  linkingConfig,
  parseDeepLink,
  createDeepLink,
  useDeepLinks,
  shareInvestment,
  openExternalURL,
  openEmail,
  openPhone,
} from './deepLinks';
