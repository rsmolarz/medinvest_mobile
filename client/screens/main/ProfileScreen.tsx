import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAuth } from '@/contexts/AuthContext';
import { colors, typography, spacing, layout, shadows } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

// Types
interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Feather.glyphMap;
  screen?: keyof RootStackParamList;
  action?: 'logout';
  badge?: string;
}

// Menu items
const MENU_ITEMS: MenuItem[] = [
  { id: '1', title: 'Documents', icon: 'file-text', screen: 'Documents' },
  { id: '2', title: 'Payment Methods', icon: 'credit-card', screen: 'PaymentMethods' },
  { id: '3', title: 'Notifications', icon: 'bell', badge: '3' },
  { id: '4', title: 'Support', icon: 'help-circle', screen: 'Support' },
  { id: '5', title: 'Legal', icon: 'shield', screen: 'Legal' },
  { id: '6', title: 'Log Out', icon: 'log-out', action: 'logout' },
];

/**
 * Profile Screen
 * Account settings and documents
 */
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, signOut } = useAuth();

  const handleMenuPress = useCallback(
    (item: MenuItem) => {
      if (item.action === 'logout') {
        Alert.alert(
          'Log Out',
          'Are you sure you want to log out?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Log Out',
              style: 'destructive',
              onPress: signOut,
            },
          ],
          { cancelable: true }
        );
      } else if (item.screen) {
        navigation.navigate(item.screen as any);
      }
    },
    [navigation, signOut]
  );

  const handleSettingsPress = useCallback(() => {
    navigation.navigate('Settings');
  }, [navigation]);

  // Get initials for avatar
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.fullName) {
      const parts = user.fullName.split(' ');
      return parts.length > 1
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : parts[0][0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const displayName =
    user?.fullName ||
    (user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email || 'User');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.screenTitle}>Profile</Text>
        <Pressable style={styles.headerButton} onPress={handleSettingsPress}>
          <Feather name="settings" size={24} color={colors.text.primary} />
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: layout.tabBarHeight + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(100)}
          style={styles.profileCard}
        >
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {user?.avatarUrl ? (
              <View style={styles.avatar}>
                {/* TODO: Add Image component with user.avatarUrl */}
                <Text style={styles.avatarText}>{getInitials()}</Text>
              </View>
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials()}</Text>
              </View>
            )}
            <Pressable style={styles.editAvatarButton}>
              <Feather name="camera" size={14} color={colors.text.inverse} />
            </Pressable>
          </View>

          {/* User Info */}
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          {/* Verification Badge */}
          {user?.isVerified && (
            <View style={styles.verifiedBadge}>
              <Feather
                name="check-circle"
                size={14}
                color={colors.semantic.success}
              />
              <Text style={styles.verifiedText}>Verified Investor</Text>
            </View>
          )}

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>5</Text>
              <Text style={styles.statLabel}>Investments</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>$125K</Text>
              <Text style={styles.statLabel}>Total Value</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>2</Text>
              <Text style={styles.statLabel}>Years</Text>
            </View>
          </View>
        </Animated.View>

        {/* Menu Items */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(200)}
          style={styles.menuContainer}
        >
          {MENU_ITEMS.map((item, index) => {
            const isLogout = item.action === 'logout';
            const isLast = index === MENU_ITEMS.length - 1;

            return (
              <Pressable
                key={item.id}
                style={[
                  styles.menuItem,
                  !isLast && styles.menuItemBorder,
                  isLogout && styles.menuItemLogout,
                ]}
                onPress={() => handleMenuPress(item)}
              >
                <View style={styles.menuItemLeft}>
                  <View
                    style={[
                      styles.menuItemIcon,
                      isLogout && styles.menuItemIconLogout,
                    ]}
                  >
                    <Feather
                      name={item.icon}
                      size={20}
                      color={isLogout ? colors.semantic.error : colors.primary.main}
                    />
                  </View>
                  <Text
                    style={[
                      styles.menuItemTitle,
                      isLogout && styles.menuItemTitleLogout,
                    ]}
                  >
                    {item.title}
                  </Text>
                </View>
                <View style={styles.menuItemRight}>
                  {item.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                  {!isLogout && (
                    <Feather
                      name="chevron-right"
                      size={20}
                      color={colors.text.tertiary}
                    />
                  )}
                </View>
              </Pressable>
            );
          })}
        </Animated.View>

        {/* App Version */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(300)}
          style={styles.versionContainer}
        >
          <Text style={styles.versionText}>MedInvest v1.0.0</Text>
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background.primary,
  },
  screenTitle: {
    ...typography.title,
    color: colors.text.primary,
  },
  headerButton: {
    padding: spacing.xs,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
  },

  // Profile Card
  profileCard: {
    backgroundColor: colors.surface.primary,
    marginHorizontal: spacing.lg,
    padding: spacing.xl,
    borderRadius: layout.radiusLarge,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.card,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: layout.avatarLarge,
    height: layout.avatarLarge,
    borderRadius: layout.avatarLarge / 2,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.title,
    color: colors.text.inverse,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface.primary,
  },
  userName: {
    ...typography.heading,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.transparent.secondary10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: layout.radiusFull,
    marginBottom: spacing.lg,
  },
  verifiedText: {
    ...typography.small,
    color: colors.semantic.success,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border.light,
  },
  statValue: {
    ...typography.heading,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.small,
    color: colors.text.secondary,
  },

  // Menu
  menuContainer: {
    backgroundColor: colors.surface.primary,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    borderRadius: layout.radiusLarge,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  menuItemLogout: {
    backgroundColor: colors.transparent.black10,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.transparent.primary10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemIconLogout: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  menuItemTitle: {
    ...typography.body,
    color: colors.text.primary,
  },
  menuItemTitleLogout: {
    color: colors.semantic.error,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: colors.semantic.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    ...typography.small,
    color: colors.text.inverse,
    fontWeight: '600',
  },

  // Version
  versionContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  versionText: {
    ...typography.small,
    color: colors.text.tertiary,
  },
});
