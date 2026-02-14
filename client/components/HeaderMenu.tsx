/**
 * Header Menu Dropdown Component
 * Navigation menu matching web version functionality
 */

import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { useAuth } from '@/contexts/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HeaderMenuProps {
  visible: boolean;
  onClose: () => void;
}

interface MenuItem {
  icon: string;
  iconType: 'ionicons' | 'material';
  label: string;
  route?: string;
  action?: () => void;
}

export default function HeaderMenu({ visible, onClose }: HeaderMenuProps) {
  const appColors = useAppColors();
  const navigation = useNavigation<any>();
  const { user, signOut } = useAuth();

  const handleNavigate = useCallback((route: string, params?: any) => {
    onClose();
    navigation.navigate(route, params);
  }, [navigation, onClose]);

  const handleLogout = useCallback(async () => {
    onClose();
    await signOut();
  }, [signOut, onClose]);

  const mainMenuItems: MenuItem[] = [
    { icon: 'home', iconType: 'ionicons', label: 'Feed', route: 'Main' },
    { icon: 'people', iconType: 'ionicons', label: 'Rooms', route: 'Main', action: () => handleNavigate('Main', { screen: 'Rooms' }) },
    { icon: 'videocam', iconType: 'ionicons', label: 'AMAs', route: 'AMADetail' },
    { icon: 'briefcase', iconType: 'ionicons', label: 'Deals', route: 'Main', action: () => handleNavigate('Main', { screen: 'Discover' }) },
    { icon: 'newspaper', iconType: 'ionicons', label: 'News', route: 'Search' },
    { icon: 'globe', iconType: 'ionicons', label: 'Network', route: 'Followers' },
  ];

  const quickActions: MenuItem[] = [
    { icon: 'chatbubbles', iconType: 'ionicons', label: 'Messages', route: 'Main', action: () => handleNavigate('Main', { screen: 'Messages' }) },
    { icon: 'robot', iconType: 'material', label: 'AI Assistant', route: 'AIChat' },
  ];

  const accountItems: MenuItem[] = [
    { icon: 'person', iconType: 'ionicons', label: 'Profile', route: 'Main', action: () => handleNavigate('Main', { screen: 'Profile' }) },
    { icon: 'bookmark', iconType: 'ionicons', label: 'Bookmarks', route: 'Bookmarks' },
    { icon: 'trophy', iconType: 'ionicons', label: 'Achievements', route: 'Achievements' },
    { icon: 'star', iconType: 'ionicons', label: 'Premium', route: 'Premium' },
    { icon: 'settings', iconType: 'ionicons', label: 'Settings', route: 'Settings' },
  ];

  const renderMenuItem = (item: MenuItem, index: number) => {
    const handlePress = () => {
      if (item.action) {
        item.action();
      } else if (item.route) {
        handleNavigate(item.route);
      }
    };

    return (
      <TouchableOpacity
        key={`${item.label}-${index}`}
        style={styles.menuItem}
        onPress={handlePress}
      >
        {item.iconType === 'ionicons' ? (
          <Ionicons name={item.icon as any} size={22} color={appColors.textPrimary} />
        ) : (
          <MaterialCommunityIcons name={item.icon as any} size={22} color={appColors.textPrimary} />
        )}
        <ThemedText style={[styles.menuItemText, { color: appColors.textPrimary }]}>{item.label}</ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable 
          style={[styles.menuContainer, { backgroundColor: appColors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {/* User Profile Section */}
            <TouchableOpacity 
              style={[styles.userSection, { borderBottomColor: appColors.border }]}
              onPress={() => handleNavigate('Main', { screen: 'Profile' })}
            >
              <View style={styles.userAvatar}>
                {user?.avatar_url ? (
                  <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <ThemedText style={styles.avatarText}>
                      {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                    </ThemedText>
                  </View>
                )}
              </View>
              <View style={styles.userInfo}>
                <ThemedText style={[styles.userName, { color: appColors.textPrimary }]}>
                  {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.email?.split('@')[0] || 'User'}
                </ThemedText>
                <ThemedText style={[styles.userHandle, { color: appColors.textSecondary }]}>
                  {user?.email || 'user@email.com'}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={appColors.textSecondary} />
            </TouchableOpacity>

            {/* Main Navigation */}
            <View style={[styles.menuSection, { borderBottomColor: appColors.border }]}>
              <ThemedText style={[styles.sectionTitle, { color: appColors.textSecondary }]}>Navigation</ThemedText>
              {mainMenuItems.map(renderMenuItem)}
            </View>

            {/* Quick Actions */}
            <View style={[styles.menuSection, { borderBottomColor: appColors.border }]}>
              <ThemedText style={[styles.sectionTitle, { color: appColors.textSecondary }]}>Quick Actions</ThemedText>
              {quickActions.map(renderMenuItem)}
            </View>

            {/* Account */}
            <View style={[styles.menuSection, { borderBottomColor: appColors.border }]}>
              <ThemedText style={[styles.sectionTitle, { color: appColors.textSecondary }]}>Account</ThemedText>
              {accountItems.map(renderMenuItem)}
            </View>

            {/* Sign Out */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} testID="button-sign-out">
              <Ionicons name="log-out-outline" size={22} color={appColors.error} />
              <ThemedText style={[styles.logoutText, { color: appColors.error }]}>Sign Out</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Menu Button for Header
interface MenuButtonProps {
  onPress: () => void;
}

export function MenuButton({ onPress }: MenuButtonProps) {
  const appColors = useAppColors();
  return (
    <TouchableOpacity style={styles.menuButton} onPress={onPress}>
      <Ionicons name="menu" size={26} color={appColors.textPrimary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    width: Math.min(SCREEN_WIDTH * 0.85, 320),
    maxHeight: SCREEN_HEIGHT * 0.9,
    borderTopLeftRadius: BorderRadius.xl,
    borderBottomLeftRadius: BorderRadius.xl,
    marginTop: 60,
    ...Shadows.card,
    shadowOpacity: 0.25,
    elevation: 10,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    backgroundColor: Colors.light.backgroundSecondary,
    borderTopLeftRadius: BorderRadius.xl,
  },
  userAvatar: {
    marginRight: Spacing.md,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.heading,
    color: 'white',
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...Typography.body,
    fontWeight: '600',
  },
  userHandle: {
    ...Typography.small,
  },
  menuSection: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    ...Typography.small,
    fontWeight: '600',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  menuItemText: {
    ...Typography.body,
    marginLeft: Spacing.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  logoutText: {
    ...Typography.body,
    marginLeft: Spacing.md,
    fontWeight: '500',
  },
  menuButton: {
    padding: Spacing.xs,
  },
});
