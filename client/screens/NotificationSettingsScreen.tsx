/**
 * Push Notification Settings Screen
 * Granular notification preferences
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useThemeContext } from '@/contexts/ThemeContext';
import { haptics } from '@/lib/haptics';

// Notification categories
interface NotificationSettings {
  // Master toggle
  enabled: boolean;
  
  // Social
  likes: boolean;
  comments: boolean;
  mentions: boolean;
  follows: boolean;
  
  // Messages
  directMessages: boolean;
  messageRequests: boolean;
  
  // Content
  newPosts: boolean;
  trendingPosts: boolean;
  roomActivity: boolean;
  
  // Deals & Investments
  newDeals: boolean;
  dealUpdates: boolean;
  investmentAlerts: boolean;
  
  // System
  announcements: boolean;
  securityAlerts: boolean;
  weeklyDigest: boolean;
  
  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "08:00"
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  likes: true,
  comments: true,
  mentions: true,
  follows: true,
  directMessages: true,
  messageRequests: true,
  newPosts: false,
  trendingPosts: true,
  roomActivity: true,
  newDeals: true,
  dealUpdates: true,
  investmentAlerts: true,
  announcements: true,
  securityAlerts: true,
  weeklyDigest: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};

const STORAGE_KEY = 'notification_settings';

export default function NotificationSettingsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useThemeContext();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');

  // Load settings
  useEffect(() => {
    loadSettings();
    checkPermissions();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      // TODO: Sync with backend
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
  };

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionStatus(status);
    
    if (status !== 'granted') {
      Alert.alert(
        'Notifications Disabled',
        'To receive notifications, please enable them in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  const updateSetting = useCallback((key: keyof NotificationSettings, value: boolean | string) => {
    haptics.toggle();
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  }, [settings]);

  const toggleMasterSwitch = useCallback((value: boolean) => {
    haptics.toggle();
    if (value && permissionStatus !== 'granted') {
      requestPermissions();
      return;
    }
    updateSetting('enabled', value);
  }, [permissionStatus, updateSetting]);

  const renderSwitch = (
    key: keyof NotificationSettings,
    label: string,
    description?: string,
    disabled?: boolean
  ) => (
    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
      <View style={styles.settingInfo}>
        <ThemedText style={[styles.settingLabel, { color: colors.textPrimary }]}>
          {label}
        </ThemedText>
        {description && (
          <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
            {description}
          </ThemedText>
        )}
      </View>
      <Switch
        value={settings[key] as boolean}
        onValueChange={(value) => updateSetting(key, value)}
        trackColor={{ false: colors.border, true: colors.primary + '80' }}
        thumbColor={settings[key] ? colors.primary : colors.textSecondary}
        disabled={disabled || !settings.enabled}
      />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Notifications
        </ThemedText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Permission Status Banner */}
        {permissionStatus !== 'granted' && (
          <TouchableOpacity
            style={[styles.permissionBanner, { backgroundColor: colors.warning + '20' }]}
            onPress={requestPermissions}
          >
            <Ionicons name="warning-outline" size={20} color={colors.warning} />
            <ThemedText style={[styles.permissionText, { color: colors.warning }]}>
              Notifications are disabled. Tap to enable.
            </ThemedText>
            <Ionicons name="chevron-forward" size={16} color={colors.warning} />
          </TouchableOpacity>
        )}

        {/* Master Toggle */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={[styles.masterToggle, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <ThemedText style={[styles.masterLabel, { color: colors.textPrimary }]}>
                Push Notifications
              </ThemedText>
              <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Receive notifications on this device
              </ThemedText>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={toggleMasterSwitch}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={settings.enabled ? colors.primary : colors.textSecondary}
            />
          </View>
        </View>

        {/* Social Notifications */}
        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            SOCIAL
          </ThemedText>
        </View>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {renderSwitch('likes', 'Likes', 'When someone likes your post or comment')}
          {renderSwitch('comments', 'Comments', 'When someone comments on your post')}
          {renderSwitch('mentions', 'Mentions', 'When someone mentions you')}
          {renderSwitch('follows', 'New Followers', 'When someone follows you')}
        </View>

        {/* Messages */}
        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            MESSAGES
          </ThemedText>
        </View>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {renderSwitch('directMessages', 'Direct Messages', 'New messages from connections')}
          {renderSwitch('messageRequests', 'Message Requests', 'New messages from others')}
        </View>

        {/* Content */}
        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            CONTENT
          </ThemedText>
        </View>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {renderSwitch('newPosts', 'New Posts', 'Posts from people you follow')}
          {renderSwitch('trendingPosts', 'Trending', 'Popular posts in your rooms')}
          {renderSwitch('roomActivity', 'Room Activity', 'Updates from your joined rooms')}
        </View>

        {/* Deals & Investments */}
        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            DEALS & INVESTMENTS
          </ThemedText>
        </View>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {renderSwitch('newDeals', 'New Deals', 'New investment opportunities')}
          {renderSwitch('dealUpdates', 'Deal Updates', 'Updates on deals you\'re watching')}
          {renderSwitch('investmentAlerts', 'Investment Alerts', 'Important alerts about your investments')}
        </View>

        {/* System */}
        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            SYSTEM
          </ThemedText>
        </View>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {renderSwitch('announcements', 'Announcements', 'Product updates and news')}
          {renderSwitch('securityAlerts', 'Security Alerts', 'Important account security notifications')}
          {renderSwitch('weeklyDigest', 'Weekly Digest', 'Summary of activity you missed')}
        </View>

        {/* Quiet Hours */}
        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            QUIET HOURS
          </ThemedText>
        </View>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {renderSwitch('quietHoursEnabled', 'Enable Quiet Hours', 'Pause notifications during set times')}
          
          {settings.quietHoursEnabled && (
            <View style={styles.quietHoursConfig}>
              <TouchableOpacity 
                style={[styles.timeSelector, { backgroundColor: colors.backgroundSecondary }]}
                disabled={!settings.enabled}
              >
                <ThemedText style={[styles.timeLabel, { color: colors.textSecondary }]}>
                  From
                </ThemedText>
                <ThemedText style={[styles.timeValue, { color: colors.textPrimary }]}>
                  {settings.quietHoursStart}
                </ThemedText>
              </TouchableOpacity>
              
              <Ionicons name="arrow-forward" size={16} color={colors.textSecondary} />
              
              <TouchableOpacity 
                style={[styles.timeSelector, { backgroundColor: colors.backgroundSecondary }]}
                disabled={!settings.enabled}
              >
                <ThemedText style={[styles.timeLabel, { color: colors.textSecondary }]}>
                  To
                </ThemedText>
                <ThemedText style={[styles.timeValue, { color: colors.textPrimary }]}>
                  {settings.quietHoursEnd}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
            Security alerts will always be delivered regardless of your notification settings.
          </ThemedText>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.heading,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    margin: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  permissionText: {
    ...Typography.caption,
    flex: 1,
    fontWeight: '500',
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.small,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  section: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.card,
  },
  masterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  masterLabel: {
    ...Typography.body,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    ...Typography.body,
  },
  settingDescription: {
    ...Typography.small,
    marginTop: 2,
  },
  quietHoursConfig: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  timeSelector: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    minWidth: 100,
  },
  timeLabel: {
    ...Typography.small,
    marginBottom: 2,
  },
  timeValue: {
    ...Typography.body,
    fontWeight: '600',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  infoText: {
    ...Typography.small,
    flex: 1,
    lineHeight: 18,
  },
});
