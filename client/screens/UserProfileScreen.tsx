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
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <ThemedText style={styles.avatarText}>
                {user.first_name[0]}{user.last_name[0]}
              </ThemedText>
            </View>
          )}
          {user.is_premium && (
            <View style={styles.premiumBadge}>
              <MaterialCommunityIcons name="crown" size={14} color={Colors.warning} />
            </View>
          )}
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <ThemedText style={styles.userName}>{user.full_name}</ThemedText>
            {user.is_verified && (
              <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
            )}
          </View>
          {user.specialty && (
            <ThemedText style={styles.userSpecialty}>{user.specialty}</ThemedText>
          )}
          {user.bio && (
            <ThemedText style={styles.userBio}>{user.bio}</ThemedText>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statItem} onPress={handleFollowers}>
              <ThemedText style={styles.statValue}>{formatNumber(user.followers_count)}</ThemedText>
              <ThemedText style={styles.statLabel}>Followers</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statItem} onPress={handleFollowing}>
              <ThemedText style={styles.statValue}>{formatNumber(user.following_count)}</ThemedText>
              <ThemedText style={styles.statLabel}>Following</ThemedText>
            </TouchableOpacity>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{formatNumber(user.posts_count)}</ThemedText>
              <ThemedText style={styles.statLabel}>Posts</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{formatNumber(user.points)}</ThemedText>
              <ThemedText style={styles.statLabel}>Points</ThemedText>
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
                  <ActivityIndicator size="small" color={user.is_following ? Colors.textSecondary : 'white'} />
                ) : (
                  <>
                    <Ionicons
                      name={user.is_following ? 'checkmark' : 'person-add-outline'}
                      size={18}
                      color={user.is_following ? Colors.textSecondary : 'white'}
                    />
                    <ThemedText style={[
                      styles.followButtonText,
                      user.is_following && styles.followingButtonText,
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
            <View style={styles.levelBadge}>
              <MaterialCommunityIcons name="star-circle" size={16} color={Colors.warning} />
              <ThemedText style={styles.levelText}>Level {user.level}</ThemedText>
            </View>
            {user.streak_days > 0 && (
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={16} color={Colors.error} />
                <ThemedText style={styles.streakText}>{user.streak_days} day streak</ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
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
                color={activeTab === tab ? Colors.primary : Colors.textSecondary}
              />
              <ThemedText style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
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
        color={Colors.textSecondary}
      />
      <ThemedText style={styles.emptyTitle}>
        No {activeTab} yet
      </ThemedText>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} numberOfLines={1}>
          {user?.full_name || 'Profile'}
        </ThemedText>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={Colors.textPrimary} />
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
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.heading,
    color: Colors.textPrimary,
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
    borderColor: Colors.surface,
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
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  userInfo: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  userName: {
    ...Typography.title,
    color: Colors.textPrimary,
  },
  userSpecialty: {
    ...Typography.caption,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  userBio: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.heading,
    color: Colors.textPrimary,
  },
  statLabel: {
    ...Typography.small,
    color: Colors.textSecondary,
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
  followingButtonText: {
    color: Colors.textSecondary,
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
    backgroundColor: Colors.warning + '15',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  levelText: {
    ...Typography.small,
    color: Colors.warning,
    fontWeight: '600',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '15',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  streakText: {
    ...Typography.small,
    color: Colors.error,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
    color: Colors.textSecondary,
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
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
});
