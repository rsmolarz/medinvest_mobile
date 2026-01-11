import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';

import { colors, typography, spacing, layout } from '@/theme';
import { useBookmarkedArticles, useToggleBookmark } from '@/api/hooks';
import { useInfiniteList } from '@/hooks/useSearch';
import type { Article } from '@/types';

export default function BookmarkedArticlesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  
  const articlesQuery = useBookmarkedArticles();
  const toggleBookmark = useToggleBookmark();

  const {
    data: articles,
    isLoading,
    refreshing,
    onRefresh,
    onEndReached,
    onEndReachedThreshold,
    isFetchingNextPage,
    isEmpty,
  } = useInfiniteList({
    data: articlesQuery.data,
    isLoading: articlesQuery.isLoading,
    isRefetching: articlesQuery.isRefetching,
    hasNextPage: articlesQuery.hasNextPage,
    isFetchingNextPage: articlesQuery.isFetchingNextPage,
    fetchNextPage: articlesQuery.fetchNextPage,
    refetch: articlesQuery.refetch,
  });

  const handleArticlePress = useCallback((article: Article) => {
    // Navigate to article detail
    console.log('Open article:', article.id);
  }, []);

  const handleRemoveBookmark = useCallback(
    (articleId: string) => {
      toggleBookmark.mutate(articleId);
    },
    [toggleBookmark]
  );

  const renderArticleItem = ({
    item,
    index,
  }: {
    item: Article;
    index: number;
  }) => (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 80)}
      layout={Layout.springify()}
    >
      <Pressable
        style={styles.articleItem}
        onPress={() => handleArticlePress(item)}
      >
        <View style={styles.articleThumbnail}>
          <Feather name="file-text" size={24} color={colors.primary.main} />
        </View>

        <View style={styles.articleContent}>
          <View style={styles.articleMeta}>
            <Text style={styles.articleCategory}>{item.category}</Text>
            <Text style={styles.articleDot}>•</Text>
            <Text style={styles.articleTime}>{item.publishedAt}</Text>
          </View>
          <Text style={styles.articleTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.articleFooter}>
            <Text style={styles.articleSource}>{item.source}</Text>
            <Pressable
              onPress={() => handleRemoveBookmark(item.id)}
              hitSlop={8}
              style={styles.removeButton}
            >
              <Feather name="bookmark" size={16} color={colors.primary.main} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      );
    }

    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Feather name="bookmark" size={64} color={colors.text.tertiary} />
        </View>
        <Text style={styles.emptyTitle}>No saved articles</Text>
        <Text style={styles.emptyDescription}>
          Articles you bookmark will appear here for easy access.
        </Text>
      </Animated.View>
    );
  };

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary.main} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Saved Articles</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        renderItem={renderArticleItem}
        ListEmptyComponent={isEmpty ? renderEmptyState : null}
        ListFooterComponent={renderFooter}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing.xl },
          isEmpty && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary.main}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.heading,
    color: colors.text.primary,
  },
  placeholder: {
    width: 32,
  },
  listContent: {
    padding: spacing.lg,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  articleItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface.primary,
    padding: spacing.md,
    borderRadius: layout.radiusMedium,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  articleThumbnail: {
    width: 72,
    height: 72,
    borderRadius: layout.radiusMedium,
    backgroundColor: colors.transparent.primary10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  articleContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  articleCategory: {
    ...typography.small,
    color: colors.primary.main,
  },
  articleDot: {
    ...typography.small,
    color: colors.text.tertiary,
    marginHorizontal: spacing.xs,
  },
  articleTime: {
    ...typography.small,
    color: colors.text.tertiary,
  },
  articleTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  articleSource: {
    ...typography.small,
    color: colors.text.tertiary,
  },
  removeButton: {
    padding: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.heading,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});
