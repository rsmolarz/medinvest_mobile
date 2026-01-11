import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors, typography, spacing, layout } from '@/theme';
import { useNotificationPreferences } from '@/services/notifications';

interface NotificationSetting {
  key: string;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
}

const NOTIFICATION_SETTINGS: NotificationSetting[] = [
  {
    key: 'investmentUpdates',
    title: 'Investment Updates',
    description: 'Get notified about updates to your investments',
    icon: 'trending-up',
  },
  {
    key: 'newOpportunities',
    title: 'New Opportunities',
    description: 'Be the first to know about new investment opportunities',
    icon: 'compass',
  },
  {
    key: 'portfolioMilestones',
    title: 'Portfolio Milestones',
    description: 'Celebrate when your portfolio hits new milestones',
    icon: 'award',
  },
  {
    key: 'articles',
    title: 'Research & Articles',
    description: 'Stay informed with the latest healthcare insights',
    icon: 'book-open',
  },
  {
    key: 'marketing',
    title: 'Marketing & Promotions',
    description: 'Receive special offers and promotional content',
    icon: 'gift',
  },
];

export default function NotificationsSettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { getPreferences, updatePreferences } = useNotificationPreferences();

  const [preferences, setPreferences] = useState<Record<string, boolean>>({
    investmentUpdates: true,
    newOpportunities: true,
    portfolioMilestones: true,
    articles: false,
    marketing: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const data = await getPreferences();
        if (data) {
          setPreferences(data);
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [getPreferences]);

  const handleToggle = useCallback(
    async (key: string, value: boolean) => {
      // Optimistic update
      setPreferences((prev) => ({ ...prev, [key]: value }));

      try {
        setIsSaving(true);
        await updatePreferences({ [key]: value });
      } catch (error) {
        // Revert on error
        setPreferences((prev) => ({ ...prev, [key]: !value }));
        Alert.alert('Error', 'Failed to update notification settings.');
      } finally {
        setIsSaving(false);
      }
    },
    [updatePreferences]
  );

  const handleEnableAll = useCallback(async () => {
    const allEnabled = Object.fromEntries(
      NOTIFICATION_SETTINGS.map((s) => [s.key, true])
    );
    setPreferences(allEnabled);

    try {
      setIsSaving(true);
      await updatePreferences(allEnabled);
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification settings.');
    } finally {
      setIsSaving(false);
    }
  }, [updatePreferences]);

  const handleDisableAll = useCallback(async () => {
    Alert.alert(
      'Disable All Notifications',
      'Are you sure you want to disable all notifications? You may miss important updates about your investments.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable All',
          style: 'destructive',
          onPress: async () => {
            const allDisabled = Object.fromEntries(
              NOTIFICATION_SETTINGS.map((s) => [s.key, false])
            );
            setPreferences(allDisabled);

            try {
              setIsSaving(true);
              await updatePreferences(allDisabled);
            } catch (error) {
              Alert.alert('Error', 'Failed to update notification settings.');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  }, [updatePreferences]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholder}>
          {isSaving && (
            <ActivityIndicator size="small" color={colors.primary.main} />
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.quickActions}
        >
          <Pressable style={styles.quickAction} onPress={handleEnableAll}>
            <Feather name="bell" size={16} color={colors.primary.main} />
            <Text style={styles.quickActionText}>Enable All</Text>
          </Pressable>
          <Pressable style={styles.quickAction} onPress={handleDisableAll}>
            <Feather name="bell-off" size={16} color={colors.text.secondary} />
            <Text style={[styles.quickActionText, styles.quickActionTextMuted]}>
              Disable All
            </Text>
          </Pressable>
        </Animated.View>

        {/* Notification Settings */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.settingsContainer}
        >
          {NOTIFICATION_SETTINGS.map((setting, index) => (
            <View
              key={setting.key}
              style={[
                styles.settingItem,
                index < NOTIFICATION_SETTINGS.length - 1 && styles.settingItemBorder,
              ]}
            >
              <View style={styles.settingIcon}>
                <Feather
                  name={setting.icon}
                  size={20}
                  color={preferences[setting.key] ? colors.primary.main : colors.text.tertiary}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{setting.title}</Text>
                <Text style={styles.settingDescription}>{setting.description}</Text>
              </View>
              <Switch
                value={preferences[setting.key]}
                onValueChange={(value) => handleToggle(setting.key, value)}
                trackColor={{
                  false: colors.border.medium,
                  true: colors.primary.light,
                }}
                thumbColor={
                  preferences[setting.key] ? colors.primary.main : colors.surface.primary
                }
              />
            </View>
          ))}
        </Animated.View>

        {/* Info Card */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(300)}
          style={styles.infoCard}
        >
          <Feather name="info" size={20} color={colors.primary.main} />
          <Text style={styles.infoText}>
            You can also manage notifications from your device's Settings app under
            MedInvest notifications.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.heading,
    color: colors.text.primary,
  },
  placeholder: {
    width: 32,
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: layout.radiusMedium,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.surface.primary,
  },
  quickActionText: {
    ...typography.captionMedium,
    color: colors.primary.main,
  },
  quickActionTextMuted: {
    color: colors.text.secondary,
  },

  // Settings
  settingsContainer: {
    backgroundColor: colors.surface.primary,
    borderRadius: layout.radiusLarge,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.transparent.primary10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 18,
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.transparent.primary10,
    padding: spacing.lg,
    borderRadius: layout.radiusMedium,
    marginTop: spacing.xl,
  },
  infoText: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  },
});
