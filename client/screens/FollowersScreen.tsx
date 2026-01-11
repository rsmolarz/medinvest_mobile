/**
 * Followers Screen
 * View followers or following list
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { usersApi } from '@/lib/api';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

type FollowersRouteParams = {
  Followers: {
    userId: number;
    type: 'followers' | 'following';
  };
};

export default function FollowersScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<FollowersRouteParams, 'Followers'>>();
  const { userId, type } = route.params;
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(type);

  // Fetch users
  const {
    data: users,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: [activeTab, userId],
    queryFn: async () => {
      const response = activeTab === 'followers'
        ? await usersApi.getFollowers(userId)
        : await usersApi.getFollowing(userId);
      return response.data?.users || [];
    },
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async ({ targetUserId, isFollowing }: { targetUserId: number; isFollowing: boolean }) => {
      if (isFollowing) {
        return usersApi.unfollow(targetUserId);
      }
      return usersApi.follow(targetUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [activeTab, userId] });
    },
  });

  const handleUserPress = useCallback((userId: number) => {
    navigation.push('UserProfile', { userId });
  }, [navigation]);

  const handleFollowPress = useCallback((targetUser: User & { is_following?: boolean }) => {
    followMutation.mutate({
      targetUserId: targetUser.id,
      isFollowing: targetUser.is_following || false,
    });
  }, [followMutation]);

  const renderUser = ({ item }: { item: User & { is_following?: boolean } }) => {
    const isCurrentUser = item.id === currentUser?.id;

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleUserPress(item.id)}
      >
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <ThemedText style={styles.avatarText}>
              {item.first_name[0]}{item.last_name[0]}
            </ThemedText>
          </View>
        )}
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <ThemedText style={styles.userName}>{item.full_name}</ThemedText>
            {item.is_verified && (
              <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
            )}
          </View>
          {item.specialty && (
            <ThemedText style={styles.userSpecialty}>{item.specialty}</ThemedText>
          )}
        </View>
        {!isCurrentUser && (
          <TouchableOpacity
            style={[
              styles.followButton,
              item.is_following && styles.followingButton,
            ]}
            onPress={() => handleFollowPress(item)}
          >
            <ThemedText style={[
              styles.followButtonText,
              item.is_following && styles.followingButtonText,
            ]}>
              {item.is_following ? 'Following' : 'Follow'}
            </ThemedText>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={48} color={Colors.textSecondary} />
        <ThemedText style={styles.emptyTitle}>
          {activeTab === 'followers' ? 'No followers yet' : 'Not following anyone'}
        </ThemedText>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Connections</ThemedText>
        <View style={styles.backButton} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'followers' && styles.tabActive]}
          onPress={() => setActiveTab('followers')}
        >
          <ThemedText style={[
            styles.tabText,
            activeTab === 'followers' && styles.tabTextActive,
          ]}>
            Followers
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' && styles.tabActive]}
          onPress={() => setActiveTab('following')}
        >
          <ThemedText style={[
            styles.tabText,
            activeTab === 'following' && styles.tabTextActive,
          ]}>
            Following
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Users List */}
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={users?.length === 0 ? styles.emptyList : undefined}
        showsVerticalScrollIndicator={false}
      />
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
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.heading,
    color: Colors.textPrimary,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: Spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  userName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  userSpecialty: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  followingButton: {
    backgroundColor: Colors.light.backgroundSecondary,
  },
  followButtonText: {
    ...Typography.caption,
    color: 'white',
    fontWeight: '600',
  },
  followingButtonText: {
    color: Colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['5xl'],
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['5xl'],
  },
  emptyTitle: {
    ...Typography.heading,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
});
