/**
 * Settings Screen
 * Account settings, preferences, and premium subscription
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionApi } from '@/lib/api';

interface SettingItemProps {
  icon: string;
  iconFamily?: 'ionicons' | 'material';
  label: string;
  value?: string;
  onPress?: () => void;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  showArrow?: boolean;
  danger?: boolean;
}

function SettingItem({
  icon,
  iconFamily = 'ionicons',
  label,
  value,
  onPress,
  isSwitch,
  switchValue,
  onSwitchChange,
  showArrow = true,
  danger,
}: SettingItemProps) {
  const IconComponent = iconFamily === 'material' ? MaterialCommunityIcons : Ionicons;

  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={isSwitch}
    >
      <View style={[styles.settingIcon, danger && styles.settingIconDanger]}>
        <IconComponent
          name={icon as any}
          size={20}
          color={danger ? Colors.error : Colors.primary}
        />
      </View>
      <View style={styles.settingContent}>
        <ThemedText style={[styles.settingLabel, danger && styles.settingLabelDanger]}>
          {label}
        </ThemedText>
        {value && <ThemedText style={styles.settingValue}>{value}</ThemedText>}
      </View>
      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: Colors.border, true: Colors.primary + '50' }}
          thumbColor={switchValue ? Colors.primary : Colors.light.backgroundTertiary}
        />
      ) : showArrow ? (
        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
      ) : null}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { user, logout, changePassword } = useAuth();

  // Notification preferences
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Subscription status
  const { data: subscriptionStatus } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const response = await subscriptionApi.getStatus();
      return response.data;
    },
  });

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Contact Support', 'Please contact support to delete your account.');
          },
        },
      ]
    );
  };

  const handleManageSubscription = async () => {
    if (subscriptionStatus?.is_premium) {
      const response = await subscriptionApi.getPortalUrl();
      if (response.data?.portal_url) {
        Linking.openURL(response.data.portal_url);
      }
    } else {
      navigation.navigate('Premium');
    }
  };

  const handleChangePassword = () => {
    Alert.prompt(
      'Current Password',
      'Enter your current password',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Next',
          onPress: (currentPwd) => {
            if (!currentPwd) return;
            Alert.prompt(
              'New Password',
              'Enter your new password',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Change',
                  onPress: async (newPwd) => {
                    if (!newPwd) return;
                    const success = await changePassword(currentPwd, newPwd);
                    if (success) {
                      Alert.alert('Success', 'Password changed successfully');
                    }
                  },
                },
              ],
              'secure-text'
            );
          },
        },
      ],
      'secure-text'
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Settings</ThemedText>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Account</ThemedText>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="person-outline"
              label="Edit Profile"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <SettingItem
              icon="mail-outline"
              label="Email"
              value={user?.email}
              showArrow={false}
            />
            <SettingItem
              icon="lock-closed-outline"
              label="Change Password"
              onPress={handleChangePassword}
            />
            <SettingItem
              icon="shield-checkmark-outline"
              label="Two-Factor Authentication"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Subscription Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Subscription</ThemedText>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="crown"
              iconFamily="material"
              label={subscriptionStatus?.is_premium ? 'Premium Member' : 'Upgrade to Premium'}
              value={subscriptionStatus?.is_premium ? 'Active' : 'Free'}
              onPress={handleManageSubscription}
            />
            {subscriptionStatus?.is_premium && (
              <SettingItem
                icon="card-outline"
                label="Manage Subscription"
                onPress={handleManageSubscription}
              />
            )}
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Notifications</ThemedText>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="notifications-outline"
              label="Push Notifications"
              isSwitch
              switchValue={pushEnabled}
              onSwitchChange={setPushEnabled}
            />
            <SettingItem
              icon="mail-outline"
              label="Email Notifications"
              isSwitch
              switchValue={emailEnabled}
              onSwitchChange={setEmailEnabled}
            />
            <SettingItem
              icon="options-outline"
              label="Notification Preferences"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Privacy</ThemedText>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="eye-off-outline"
              label="Private Profile"
              isSwitch
              switchValue={false}
              onSwitchChange={() => {}}
            />
            <SettingItem
              icon="people-outline"
              label="Blocked Users"
              onPress={() => {}}
            />
            <SettingItem
              icon="download-outline"
              label="Download My Data"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Appearance</ThemedText>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="moon-outline"
              label="Dark Mode"
              isSwitch
              switchValue={darkMode}
              onSwitchChange={setDarkMode}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Support</ThemedText>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="help-circle-outline"
              label="Help Center"
              onPress={() => Linking.openURL('https://medinvest.com/help')}
            />
            <SettingItem
              icon="chatbubble-outline"
              label="Contact Support"
              onPress={() => Linking.openURL('mailto:support@medinvest.com')}
            />
            <SettingItem
              icon="document-text-outline"
              label="Terms of Service"
              onPress={() => Linking.openURL('https://medinvest.com/terms')}
            />
            <SettingItem
              icon="shield-outline"
              label="Privacy Policy"
              onPress={() => Linking.openURL('https://medinvest.com/privacy')}
            />
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="log-out-outline"
              label="Sign Out"
              onPress={handleLogout}
              showArrow={false}
            />
            <SettingItem
              icon="trash-outline"
              label="Delete Account"
              onPress={handleDeleteAccount}
              showArrow={false}
              danger
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <ThemedText style={styles.appVersion}>MedInvest v1.0.0</ThemedText>
          <ThemedText style={styles.appCopyright}>© 2024 MedInvest Inc.</ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.heading,
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionContent: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  settingIconDanger: {
    backgroundColor: Colors.error + '15',
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  settingLabelDanger: {
    color: Colors.error,
  },
  settingValue: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  appVersion: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  appCopyright: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
