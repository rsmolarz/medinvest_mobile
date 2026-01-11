/**
 * Hashtag Screen
 * View posts by hashtag
 */

import React, { useCallback } from 'react';
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
import { useInfiniteQuery } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { searchApi } from '@/lib/api';
import { Post } from '@/types';
import PostCard from '@/components/PostCard';

type HashtagRouteParams = {
  Hashtag: {
    tag: string;
  };
};

export default function HashtagScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<HashtagRouteParams, 'Hashtag'>>();
  const { tag } = route.params;

  const {
    data: feedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['hashtag', tag],
    queryFn: async ({ pageParam }) => {
      const response = await searchApi.search(`#${tag}`, 'posts');
      return response.data;
    },
    getNextPageParam: () => undefined, // Pagination not implemented for search
    initialPageParam: undefined,
  });

  const posts = feedData?.pages.flatMap(page => page?.posts || []) || [];

  const handlePostPress = useCallback((postId: number) => {
    navigation.navigate('PostDetail', { postId });
  }, [navigation]);

  const handleUserPress = useCallback((userId: number) => {
    navigation.navigate('UserProfile', { userId });
  }, [navigation]);

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onPress={() => handlePostPress(item.id)}
      onUserPress={() => handleUserPress(item.author.id)}
      onVote={() => {}}
      onBookmark={() => {}}
    />
  );

  const renderHeader = () => (
    <View style={styles.hashtagHeader}>
      <View style={styles.hashtagIcon}>
        <ThemedText style={styles.hashtagSymbol}>#</ThemedText>
      </View>
      <View style={styles.hashtagInfo}>
        <ThemedText style={styles.hashtagName}>{tag}</ThemedText>
        <ThemedText style={styles.hashtagCount}>
          {posts.length} posts
        </ThemedText>
      </View>
    </View>
  );

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
        <Ionicons name="search-outline" size={48} color={Colors.textSecondary} />
        <ThemedText style={styles.emptyTitle}>No posts found</ThemedText>
        <ThemedText style={styles.emptySubtitle}>
          No posts with #{tag} yet
        </ThemedText>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={styles.navTitle}>#{tag}</ThemedText>
        <View style={styles.backButton} />
      </View>

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
  navHeader: {
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
  navTitle: {
    ...Typography.heading,
    color: Colors.textPrimary,
  },
  hashtagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  hashtagIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  hashtagSymbol: {
    ...Typography.title,
    color: Colors.primary,
  },
  hashtagInfo: {
    flex: 1,
  },
  hashtagName: {
    ...Typography.title,
    color: Colors.textPrimary,
  },
  hashtagCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['5xl'],
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['5xl'],
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.heading,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
