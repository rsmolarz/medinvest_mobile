/**
 * Bookmarks Screen
 * View saved/bookmarked posts
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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { usersApi, postsApi } from '@/lib/api';
import { Post } from '@/types';
import PostCard from '@/components/PostCard';

export default function BookmarksScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const appColors = useAppColors();

  const {
    data: posts,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      const response = await usersApi.getBookmarks();
      return response.data?.posts || [];
    },
  });

  const removeBookmarkMutation = useMutation({
    mutationFn: (postId: number) => postsApi.removeBookmark(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });

  const handlePostPress = useCallback((postId: number) => {
    navigation.navigate('PostDetail', { postId });
  }, [navigation]);

  const handleUserPress = useCallback((userId: number) => {
    navigation.navigate('UserProfile', { userId });
  }, [navigation]);

  const handleRemoveBookmark = useCallback((postId: number) => {
    removeBookmarkMutation.mutate(postId);
  }, [removeBookmarkMutation]);

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onPress={() => handlePostPress(item.id)}
      onUserPress={() => handleUserPress(item.author.id)}
      onVote={() => {}}
      onBookmark={() => handleRemoveBookmark(item.id)}
    />
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
        <Ionicons name="bookmark-outline" size={64} color={appColors.textSecondary} />
        <ThemedText style={[styles.emptyTitle, { color: appColors.textPrimary }]}>No bookmarks yet</ThemedText>
        <ThemedText style={[styles.emptySubtitle, { color: appColors.textSecondary }]}>
          Posts you save will appear here
        </ThemedText>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: appColors.surface, borderBottomColor: appColors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={appColors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: appColors.textPrimary }]}>Bookmarks</ThemedText>
        <View style={styles.backButton} />
      </View>

      {/* Posts List */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={posts?.length === 0 ? styles.emptyList : undefined}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    width: 40,
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.heading,
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
});
