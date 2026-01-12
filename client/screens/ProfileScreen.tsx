import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { RootStackParamList } from '@/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useThemeContext();
  const { user, signOut } = useAuth();

  const menuItems = [
    { icon: 'bookmark', label: 'Bookmarks', screen: 'Bookmarks' as const },
    { icon: 'award', label: 'Achievements', screen: 'Achievements' as const },
    { icon: 'bar-chart-2', label: 'Leaderboard', screen: 'Leaderboard' as const },
    { icon: 'settings', label: 'Settings', screen: 'Settings' as const },
  ];

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText type="title">Profile</ThemedText>
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            style={({ pressed }) => [
              styles.headerButton,
              { backgroundColor: colors.backgroundSecondary, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="settings" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View style={[styles.profileCard, { backgroundColor: colors.surface }, Shadows.card]}>
          {user?.avatarUrl ? (
            <Image
              source={{ uri: user.avatarUrl }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
              <ThemedText type="title" style={{ color: colors.primary }}>
                {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
              </ThemedText>
            </View>
          )}
          <ThemedText type="heading" style={styles.userName}>
            {user?.fullName || user?.email || 'User'}
          </ThemedText>
          <ThemedText type="body" style={{ color: colors.textSecondary }}>
            {user?.email || ''}
          </ThemedText>
          <Pressable
            onPress={() => navigation.navigate('EditProfile')}
            style={({ pressed }) => [
              styles.editButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Feather name="edit-2" size={16} color="#FFFFFF" />
            <ThemedText type="body" style={{ color: '#FFFFFF', marginLeft: Spacing.xs }}>
              Edit Profile
            </ThemedText>
          </Pressable>
        </View>

        <View style={[styles.menuSection, { backgroundColor: colors.surface }, Shadows.card]}>
          {menuItems.map((item, index) => (
            <Pressable
              key={item.screen}
              onPress={() => navigation.navigate(item.screen)}
              style={({ pressed }) => [
                styles.menuItem,
                { opacity: pressed ? 0.7 : 1 },
                index < menuItems.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.primary + '15' }]}>
                <Feather name={item.icon as any} size={20} color={colors.primary} />
              </View>
              <ThemedText type="heading" style={styles.menuLabel}>
                {item.label}
              </ThemedText>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            { backgroundColor: colors.error + '15', opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="log-out" size={20} color={colors.error} />
          <ThemedText type="heading" style={{ color: colors.error, marginLeft: Spacing.sm }}>
            Sign Out
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: Spacing.md,
  },
  userName: {
    marginBottom: Spacing.xs,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.lg,
  },
  menuSection: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuLabel: {
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
});
