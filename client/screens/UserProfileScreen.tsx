/**
 * UserProfile Screen
 * View other users' profiles
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { usersApi, feedApi } from '@/lib/api';
import { User, Post } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { formatNumber } from '@/lib/utils';
import PostCard from '@/components/PostCard';

type UserProfileRouteParams = {
  UserProfile: {
    userId: number;
  };
};

type TabType = 'posts' | 'comments' | 'likes';

export default function UserProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<UserProfileRouteParams, 'UserProfile'>>();
  const { userId } = route.params;
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const appColors = useAppColors();

  const [activeTab, setActiveTab] = useState<TabType>('posts');

  const isOwnProfile = currentUser?.id === userId;

  // Fetch user profile
  const {
    data: user,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      const response = await usersApi.getUser(userId);
      return response.data;
    },
  });

  // Fetch user posts
  const { data: posts } = useQuery({
    queryKey: ['userPosts', userId, activeTab],
    queryFn: async () => {
      let response;
      switch (activeTab) {
        case 'comments':
          response = await usersApi.getUserComments(userId);
          break;
        case 'likes':
          response = await usersApi.getUserLikes(userId);
          break;
        default:
          response = await usersApi.getUserPosts(userId);
      }
      return response.data?.posts || [];
    },
    enabled: !!user,
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (user?.is_following) {
        return usersApi.unfollow(userId);
      }
      return usersApi.follow(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
    },
  });

  const handleMessage = useCallback(() => {
    navigation.navigate('Conversation', { userId });
  }, [navigation, userId]);

  const handleFollowers = useCallback(() => {
    navigation.navigate('Followers', { userId, type: 'followers' });
  }, [navigation, userId]);

  const handleFollowing = useCallback(() => {
    navigation.navigate('Followers', { userId, type: 'following' });
  }, [navigation, userId]);

  const handlePostPress = useCallback((postId: number) => {
    navigation.navigate('PostDetail', { postId });
  }, [navigation]);

  const handleReport = useCallback(() => {
    // Open report modal
  }, []);

  const handleBlock = useCallback(() => {
    // Block user
  }, []);

  const renderHeader = () => {
    if (!user) return null;

    return (
      <View>
        {/* Cover & Avatar */}
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.coverGradient}
        />
        <View style={styles.avatarContainer}>
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={[styles.avatar, { borderColor: appColors.surface }]} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { borderColor: appColors.surface }]}>
              <ThemedText style={styles.avatarText}>
                {user.first_name[0]}{user.last_name[0]}
              </ThemedText>
            </View>
          )}
          {user.is_premium && (
            <View style={[styles.premiumBadge, { backgroundColor: appColors.surface }]}>
              <MaterialCommunityIcons name="crown" size={14} color={appColors.warning} />
            </View>
          )}
        </View>

        {/* User Info */}
        <View style={[styles.userInfo, { backgroundColor: appColors.surface }]}>
          <View style={styles.nameRow}>
            <ThemedText style={[styles.userName, { color: appColors.textPrimary }]}>{user.full_name}</ThemedText>
            {user.is_verified && (
              <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
            )}
          </View>
          {user.specialty && (
            <ThemedText style={styles.userSpecialty}>{user.specialty}</ThemedText>
          )}
          {user.bio && (
            <ThemedText style={[styles.userBio, { color: appColors.textSecondary }]}>{user.bio}</ThemedText>
          )}

          {/* Stats */}
          <View style={[styles.statsRow, { borderTopColor: appColors.border }]}>
            <TouchableOpacity style={styles.statItem} onPress={handleFollowers}>
              <ThemedText style={[styles.statValue, { color: appColors.textPrimary }]}>{formatNumber(user.followers_count)}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: appColors.textSecondary }]}>Followers</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statItem} onPress={handleFollowing}>
              <ThemedText style={[styles.statValue, { color: appColors.textPrimary }]}>{formatNumber(user.following_count)}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: appColors.textSecondary }]}>Following</ThemedText>
            </TouchableOpacity>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: appColors.textPrimary }]}>{formatNumber(user.posts_count)}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: appColors.textSecondary }]}>Posts</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: appColors.textPrimary }]}>{formatNumber(user.points)}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: appColors.textSecondary }]}>Points</ThemedText>
            </View>
          </View>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[
                  styles.followButton,
                  user.is_following && styles.followingButton,
                ]}
                onPress={() => followMutation.mutate()}
                disabled={followMutation.isPending}
              >
                {followMutation.isPending ? (
                  <ActivityIndicator size="small" color={user.is_following ? appColors.textSecondary : 'white'} />
                ) : (
                  <>
                    <Ionicons
                      name={user.is_following ? 'checkmark' : 'person-add-outline'}
                      size={18}
                      color={user.is_following ? appColors.textSecondary : 'white'}
                    />
                    <ThemedText style={[
                      styles.followButtonText,
                      user.is_following && { color: appColors.textSecondary },
                    ]}>
                      {user.is_following ? 'Following' : 'Follow'}
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
                <Ionicons name="chatbubble-outline" size={18} color={Colors.primary} />
                <ThemedText style={styles.messageButtonText}>Message</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Gamification */}
          <View style={styles.gamificationRow}>
            <View style={[styles.levelBadge, { backgroundColor: appColors.warning + '15' }]}>
              <MaterialCommunityIcons name="star-circle" size={16} color={appColors.warning} />
              <ThemedText style={[styles.levelText, { color: appColors.warning }]}>Level {user.level}</ThemedText>
            </View>
            {user.streak_days > 0 && (
              <View style={[styles.streakBadge, { backgroundColor: appColors.error + '15' }]}>
                <Ionicons name="flame" size={16} color={appColors.error} />
                <ThemedText style={[styles.streakText, { color: appColors.error }]}>{user.streak_days} day streak</ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: appColors.surface, borderBottomColor: appColors.border }]}>
          {(['posts', 'comments', 'likes'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Ionicons
                name={
                  tab === 'posts' ? 'grid-outline' :
                  tab === 'comments' ? 'chatbox-outline' : 'heart-outline'
                }
                size={20}
                color={activeTab === tab ? Colors.primary : appColors.textSecondary}
              />
              <ThemedText style={[styles.tabText, { color: appColors.textSecondary }, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onPress={() => handlePostPress(item.id)}
      onUserPress={() => {}}
      onVote={() => {}}
      onBookmark={() => {}}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={
          activeTab === 'posts' ? 'document-text-outline' :
          activeTab === 'comments' ? 'chatbox-outline' : 'heart-outline'
        }
        size={48}
        color={appColors.textSecondary}
      />
      <ThemedText style={[styles.emptyTitle, { color: appColors.textPrimary }]}>
        No {activeTab} yet
      </ThemedText>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: appColors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: appColors.surface, borderBottomColor: appColors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={appColors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: appColors.textPrimary }]} numberOfLines={1}>
          {user?.full_name || 'Profile'}
        </ThemedText>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={appColors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
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
    flex: 1,
    textAlign: 'center',
  },
  moreButton: {
    padding: Spacing.sm,
  },
  coverGradient: {
    height: 120,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: -50,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.title,
    color: Colors.primary,
  },
  premiumBadge: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  userInfo: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  userName: {
    ...Typography.title,
  },
  userSpecialty: {
    ...Typography.caption,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  userBio: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.heading,
  },
  statLabel: {
    ...Typography.small,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  followButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  followingButton: {
    backgroundColor: Colors.light.backgroundSecondary,
  },
  followButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '15',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  messageButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  gamificationRow: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  levelText: {
    ...Typography.small,
    fontWeight: '600',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  streakText: {
    ...Typography.small,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    ...Typography.caption,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['5xl'],
  },
  emptyTitle: {
    ...Typography.heading,
    marginTop: Spacing.lg,
  },
});
