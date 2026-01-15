/**
 * Home Feed Screen
 * Main social feed with posts, trending topics, and room filters
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { feedApi, postsApi, roomsApi, notificationsApi } from '@/lib/api';
import { Post, Room, FeedStyle, TrendingTopic } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import PostCard from '@/components/PostCard';
import TrendingSidebar from '@/components/TrendingSidebar';
import RoomFilter from '@/components/RoomFilter';
import { NotificationBell } from '@/components/NotificationsDropdown';
import NotificationsDropdown from '@/components/NotificationsDropdown';
import HeaderMenu, { MenuButton } from '@/components/HeaderMenu';
import PeopleYouMayKnow from '@/components/PeopleYouMayKnow';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [feedStyle, setFeedStyle] = useState<FeedStyle>('algorithmic');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [showTrending, setShowTrending] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Fetch unread count
  const { data: notificationData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const response = await notificationsApi.getNotifications(1);
      return { unread_count: response.data?.unread_count || 0 };
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Fetch rooms
  const { data: roomsData } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const response = await roomsApi.getRooms();
      return response.data?.rooms || [];
    },
  });

  // Fetch trending topics
  const { data: trendingData } = useQuery({
    queryKey: ['trending'],
    queryFn: async () => {
      const response = await feedApi.getTrending();
      return response.data?.topics || [];
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Infinite scroll feed
  const {
    data: feedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['feed', feedStyle, selectedRoom],
    queryFn: async ({ pageParam }) => {
      if (selectedRoom) {
        const response = await feedApi.getRoomFeed(selectedRoom, pageParam);
        return response.data;
      }
      const response = await feedApi.getFeed(pageParam, feedStyle);
      return response.data;
    },
    getNextPageParam: (lastPage) => lastPage?.next_cursor,
    initialPageParam: undefined as string | undefined,
  });

  const posts = feedData?.pages.flatMap(page => page?.posts || []) || [];

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ postId, direction }: { postId: number; direction: 'up' | 'down' }) => {
      return postsApi.vote(postId, direction);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async ({ postId, isBookmarked }: { postId: number; isBookmarked: boolean }) => {
      if (isBookmarked) {
        return postsApi.removeBookmark(postId);
      }
      return postsApi.bookmark(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const handleRefresh = useCallback(() => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['trending'] });
  }, [refetch, queryClient]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleVote = useCallback((postId: number, direction: 'up' | 'down') => {
    voteMutation.mutate({ postId, direction });
  }, [voteMutation]);

  const handleBookmark = useCallback((postId: number, isBookmarked: boolean) => {
    bookmarkMutation.mutate({ postId, isBookmarked });
  }, [bookmarkMutation]);

  const handlePostPress = useCallback((postId: number) => {
    navigation.navigate('PostDetail', { postId });
  }, [navigation]);

  const handleUserPress = useCallback((userId: number) => {
    navigation.navigate('UserProfile', { userId });
  }, [navigation]);

  const handleHashtagPress = useCallback((tag: string) => {
    navigation.navigate('Hashtag', { tag });
  }, [navigation]);

  const handleCreatePost = useCallback(() => {
    navigation.navigate('CreatePost', { roomSlug: selectedRoom });
  }, [navigation, selectedRoom]);

  // Header animation
  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  const renderPost = useCallback(({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onPress={() => handlePostPress(item.id)}
      onUserPress={() => handleUserPress(Number(item.author.id))}
      onVote={(direction) => direction && handleVote(item.id, direction)}
      onBookmark={() => handleBookmark(item.id, item.is_bookmarked)}
      onHashtagPress={handleHashtagPress}
      onMentionPress={handleUserPress}
    />
  ), [handlePostPress, handleUserPress, handleVote, handleBookmark, handleHashtagPress]);

  const renderHeader = () => (
    <View style={styles.feedHeader}>
      {/* Feed Style Selector */}
      <View style={styles.feedStyleContainer}>
        <TouchableOpacity
          style={[styles.feedStyleButton, feedStyle === 'algorithmic' && styles.feedStyleActive]}
          onPress={() => setFeedStyle('algorithmic')}
        >
          <Ionicons 
            name="sparkles" 
            size={16} 
            color={feedStyle === 'algorithmic' ? Colors.primary : Colors.textSecondary} 
          />
          <ThemedText style={[
            styles.feedStyleText,
            feedStyle === 'algorithmic' && styles.feedStyleTextActive
          ]}>
            For You
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.feedStyleButton, feedStyle === 'chronological' && styles.feedStyleActive]}
          onPress={() => setFeedStyle('chronological')}
        >
          <Ionicons 
            name="time-outline" 
            size={16} 
            color={feedStyle === 'chronological' ? Colors.primary : Colors.textSecondary} 
          />
          <ThemedText style={[
            styles.feedStyleText,
            feedStyle === 'chronological' && styles.feedStyleTextActive
          ]}>
            Latest
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.feedStyleButton, feedStyle === 'discovery' && styles.feedStyleActive]}
          onPress={() => setFeedStyle('discovery')}
        >
          <Ionicons 
            name="compass-outline" 
            size={16} 
            color={feedStyle === 'discovery' ? Colors.primary : Colors.textSecondary} 
          />
          <ThemedText style={[
            styles.feedStyleText,
            feedStyle === 'discovery' && styles.feedStyleTextActive
          ]}>
            Discover
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Room Filter */}
      <RoomFilter
        rooms={roomsData || []}
        selectedRoom={selectedRoom}
        onSelectRoom={setSelectedRoom}
      />
    </View>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="post-outline" size={64} color={Colors.textSecondary} />
        <ThemedText style={styles.emptyTitle}>No posts yet</ThemedText>
        <ThemedText style={styles.emptySubtitle}>
          {selectedRoom 
            ? 'Be the first to post in this room!'
            : 'Follow people and join rooms to see posts here'}
        </ThemedText>
        <TouchableOpacity style={styles.emptyButton} onPress={handleCreatePost}>
          <ThemedText style={styles.emptyButtonText}>Create Post</ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Animated Header */}
      <Animated.View style={[styles.header, { transform: [{ translateY: headerTranslate }] }]}>
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>MedInvest</ThemedText>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setShowTrending(!showTrending)}
            >
              <Ionicons name="trending-up" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.navigate('Search')}
            >
              <Ionicons name="search" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <NotificationBell 
              unreadCount={notificationData?.unread_count || 0}
              onPress={() => setShowNotifications(true)}
            />
            <MenuButton onPress={() => setShowMenu(true)} />
          </View>
        </View>
      </Animated.View>

      {/* Notifications Dropdown */}
      <NotificationsDropdown
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        anchorPosition={{ top: 100, right: 16 }}
      />

      {/* Header Menu */}
      <HeaderMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
      />

      {/* Main Content */}
      <View style={styles.content}>
        {/* Feed */}
        <Animated.FlatList
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
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.feedContent}
        />

        {/* Trending Sidebar (shown on larger screens or as modal) */}
        {showTrending && (
          <TrendingSidebar
            topics={trendingData || []}
            onTopicPress={handleHashtagPress}
            onClose={() => setShowTrending(false)}
          />
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleCreatePost}>
        <Ionicons name="add" size={28} color={Colors.light.buttonText} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    ...Typography.title,
    color: Colors.primary,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  feedContent: {
    paddingBottom: 100,
  },
  feedHeader: {
    backgroundColor: Colors.surface,
    paddingBottom: Spacing.md,
  },
  feedStyleContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  feedStyleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.backgroundSecondary,
    gap: Spacing.xs,
  },
  feedStyleActive: {
    backgroundColor: Colors.primary + '15',
  },
  feedStyleText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  feedStyleTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  loadingFooter: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['5xl'],
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.heading,
    marginTop: Spacing.lg,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
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
    color: Colors.light.buttonText,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.fab,
  },
});
