/**
 * RoomDetail Screen
 * View room info, members, and posts
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { roomsApi, feedApi } from '@/lib/api';
import { Room, Post } from '@/types';
import { formatNumber } from '@/lib/utils';
import PostCard from '@/components/PostCard';

type RoomDetailRouteParams = {
  RoomDetail: {
    roomSlug: string;
  };
};

export default function RoomDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RoomDetailRouteParams, 'RoomDetail'>>();
  const { roomSlug } = route.params;
  const queryClient = useQueryClient();
  const appColors = useAppColors();

  // Fetch room details
  const {
    data: room,
    isLoading: roomLoading,
  } = useQuery({
    queryKey: ['room', roomSlug],
    queryFn: async () => {
      const response = await roomsApi.getRoom(roomSlug);
      return response.data;
    },
  });

  // Fetch room posts
  const {
    data: feedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['roomFeed', roomSlug],
    queryFn: async ({ pageParam }) => {
      const response = await feedApi.getRoomFeed(roomSlug, pageParam);
      return response.data;
    },
    getNextPageParam: (lastPage) => lastPage?.next_cursor,
    initialPageParam: undefined as string | undefined,
  });

  const posts = feedData?.pages.flatMap(page => page?.posts || []) || [];

  // Join/Leave room mutation
  const membershipMutation = useMutation({
    mutationFn: async () => {
      if (room?.is_member) {
        return roomsApi.leaveRoom(roomSlug);
      }
      return roomsApi.joinRoom(roomSlug);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', roomSlug] });
    },
  });

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleCreatePost = useCallback(() => {
    navigation.navigate('CreatePost', { roomSlug });
  }, [navigation, roomSlug]);

  const handlePostPress = useCallback((postId: number) => {
    navigation.navigate('PostDetail', { postId });
  }, [navigation]);

  const handleUserPress = useCallback((userId: number) => {
    navigation.navigate('UserProfile', { userId });
  }, [navigation]);

  const renderHeader = () => {
    if (!room) return null;

    return (
      <View style={[styles.header, { backgroundColor: appColors.surface }]}>
        {/* Room Banner */}
        <LinearGradient
          colors={[room.color, room.color + 'CC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <ThemedText style={styles.roomIcon}>{room.icon}</ThemedText>
        </LinearGradient>

        {/* Room Info */}
        <View style={styles.roomInfo}>
          <ThemedText style={[styles.roomName, { color: appColors.textPrimary }]}>{room.name}</ThemedText>
          <ThemedText style={[styles.roomDescription, { color: appColors.textSecondary }]}>{room.description}</ThemedText>

          {/* Stats */}
          <View style={[styles.statsRow, { borderColor: appColors.border }]}>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: appColors.textPrimary }]}>
                {formatNumber(room.members_count)}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: appColors.textSecondary }]}>Members</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: appColors.border }]} />
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: appColors.textPrimary }]}>
                {formatNumber(room.posts_count)}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: appColors.textSecondary }]}>Posts</ThemedText>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.joinButton,
                room.is_member && styles.joinedButton,
              ]}
              onPress={() => membershipMutation.mutate()}
              disabled={membershipMutation.isPending}
            >
              {membershipMutation.isPending ? (
                <ActivityIndicator size="small" color={room.is_member ? appColors.textSecondary : 'white'} />
              ) : (
                <>
                  <Ionicons
                    name={room.is_member ? 'checkmark' : 'add'}
                    size={18}
                    color={room.is_member ? appColors.textSecondary : 'white'}
                  />
                  <ThemedText style={[
                    styles.joinButtonText,
                    room.is_member && [styles.joinedButtonText, { color: appColors.textSecondary }],
                  ]}>
                    {room.is_member ? 'Joined' : 'Join'}
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>

            {room.is_member && (
              <TouchableOpacity style={styles.createButton} onPress={handleCreatePost}>
                <Ionicons name="create-outline" size={18} color={Colors.primary} />
                <ThemedText style={styles.createButtonText}>Create Post</ThemedText>
              </TouchableOpacity>
            )}
          </View>

          {/* Rules */}
          {room.rules && room.rules.length > 0 && (
            <View style={styles.rulesSection}>
              <ThemedText style={[styles.rulesTitle, { color: appColors.textSecondary }]}>Room Rules</ThemedText>
              {room.rules.map((rule, index) => (
                <View key={index} style={styles.ruleItem}>
                  <ThemedText style={[styles.ruleNumber, { color: appColors.textSecondary }]}>{index + 1}.</ThemedText>
                  <ThemedText style={[styles.ruleText, { color: appColors.textPrimary }]}>{rule}</ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Posts Header */}
        <View style={[styles.postsHeader, { borderTopColor: appColors.border }]}>
          <ThemedText style={[styles.postsTitle, { color: appColors.textPrimary }]}>Posts</ThemedText>
        </View>
      </View>
    );
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onPress={() => handlePostPress(item.id)}
      onUserPress={() => handleUserPress(item.author.id)}
      onVote={() => {}}
      onBookmark={() => {}}
    />
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={48} color={appColors.textSecondary} />
      <ThemedText style={[styles.emptyTitle, { color: appColors.textPrimary }]}>No posts yet</ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: appColors.textSecondary }]}>
        Be the first to post in this room!
      </ThemedText>
      {room?.is_member && (
        <TouchableOpacity style={styles.emptyButton} onPress={handleCreatePost}>
          <ThemedText style={styles.emptyButtonText}>Create Post</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );

  if (roomLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: appColors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['top']}>
      {/* Navigation Header */}
      <View style={[styles.navHeader, { backgroundColor: appColors.surface, borderBottomColor: appColors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={appColors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={[styles.navTitle, { color: appColors.textPrimary }]} numberOfLines={1}>
          {room?.name}
        </ThemedText>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={appColors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Posts List */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
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
  navHeader: {
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
  navTitle: {
    ...Typography.heading,
    flex: 1,
    textAlign: 'center',
  },
  moreButton: {
    padding: Spacing.sm,
  },
  header: {
    marginBottom: Spacing.md,
  },
  banner: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomIcon: {
    fontSize: 48,
  },
  roomInfo: {
    padding: Spacing.lg,
  },
  roomName: {
    ...Typography.title,
    marginBottom: Spacing.xs,
  },
  roomDescription: {
    ...Typography.body,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
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
  joinButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  joinedButton: {
    backgroundColor: Colors.light.backgroundSecondary,
  },
  joinButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
  joinedButtonText: {
  },
  createButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '15',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  createButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  rulesSection: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
  },
  rulesTitle: {
    ...Typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  ruleItem: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  ruleNumber: {
    ...Typography.caption,
    width: 20,
  },
  ruleText: {
    ...Typography.caption,
    flex: 1,
  },
  postsHeader: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  postsTitle: {
    ...Typography.heading,
  },
  loadingFooter: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['5xl'],
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.heading,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  emptyButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  emptyButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
});
