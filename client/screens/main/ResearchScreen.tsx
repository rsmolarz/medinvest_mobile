import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  Layout,
} from 'react-native-reanimated';

import { colors, typography, spacing, layout, shadows } from '@/theme';

// Types
interface Article {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  readTime: number;
  imageUrl?: string;
  category: string;
  isFeatured?: boolean;
  isBookmarked?: boolean;
}

// Mock data
const MOCK_ARTICLES: Article[] = [
  {
    id: '1',
    title: 'The Future of AI in Medical Diagnostics: A $50B Opportunity',
    summary: 'Artificial intelligence is revolutionizing how doctors diagnose diseases, with the market expected to grow exponentially over the next decade.',
    source: 'MedTech Insights',
    publishedAt: '2 hours ago',
    readTime: 8,
    category: 'AI & Healthcare',
    isFeatured: true,
  },
  {
    id: '2',
    title: 'Gene Therapy Breakthroughs: What Investors Need to Know',
    summary: 'Recent FDA approvals have opened new doors for gene therapy investments.',
    source: 'BioPharma Weekly',
    publishedAt: '5 hours ago',
    readTime: 5,
    category: 'Biotech',
  },
  {
    id: '3',
    title: 'Digital Health Startups Raised Record $15B in 2024',
    summary: 'Venture capital continues to flow into healthcare technology companies.',
    source: 'Healthcare Finance',
    publishedAt: '1 day ago',
    readTime: 4,
    category: 'Market Trends',
    isBookmarked: true,
  },
  {
    id: '4',
    title: 'Medical Device Innovation: Top Trends for 2025',
    summary: 'From wearables to surgical robots, here are the technologies shaping the industry.',
    source: 'Device Magazine',
    publishedAt: '2 days ago',
    readTime: 6,
    category: 'Medical Devices',
  },
  {
    id: '5',
    title: 'Telemedicine After COVID: Sustainable Growth or Bubble?',
    summary: 'Analysis of the telehealth sector two years after the pandemic boom.',
    source: 'Digital Health Today',
    publishedAt: '3 days ago',
    readTime: 7,
    category: 'Digital Health',
  },
];

/**
 * Research Screen
 * Healthcare news and insights
 */
export default function ResearchScreen() {
  const insets = useSafeAreaInsets();
  
  const [refreshing, setRefreshing] = useState(false);
  const [articles] = useState<Article[]>(MOCK_ARTICLES);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(
    new Set(MOCK_ARTICLES.filter((a) => a.isBookmarked).map((a) => a.id))
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const handleArticlePress = useCallback((article: Article) => {
    // TODO: Navigate to article detail
    console.log('Open article:', article.id);
  }, []);

  const handleBookmarkPress = useCallback((articleId: string) => {
    setBookmarkedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });
  }, []);

  const featuredArticle = articles.find((a) => a.isFeatured);
  const regularArticles = articles.filter((a) => !a.isFeatured);

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Featured Article */}
      {featuredArticle && (
        <Animated.View entering={FadeInDown.duration(600).delay(100)}>
          <Pressable
            style={styles.featuredCard}
            onPress={() => handleArticlePress(featuredArticle)}
          >
            <View style={styles.featuredImagePlaceholder}>
              <Feather name="book-open" size={48} color={colors.primary.main} />
            </View>
            <View style={styles.featuredContent}>
              <View style={styles.featuredMeta}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>
                    {featuredArticle.category}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleBookmarkPress(featuredArticle.id)}
                  hitSlop={8}
                >
                  <Feather
                    name={bookmarkedIds.has(featuredArticle.id) ? 'bookmark' : 'bookmark'}
                    size={20}
                    color={
                      bookmarkedIds.has(featuredArticle.id)
                        ? colors.primary.main
                        : colors.text.tertiary
                    }
                  />
                </Pressable>
              </View>
              <Text style={styles.featuredTitle} numberOfLines={3}>
                {featuredArticle.title}
              </Text>
              <Text style={styles.featuredSummary} numberOfLines={2}>
                {featuredArticle.summary}
              </Text>
              <View style={styles.featuredFooter}>
                <Text style={styles.sourceText}>{featuredArticle.source}</Text>
                <View style={styles.readTimeContainer}>
                  <Feather
                    name="clock"
                    size={12}
                    color={colors.text.tertiary}
                  />
                  <Text style={styles.readTimeText}>
                    {featuredArticle.readTime} min read
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      )}

      {/* Section Header */}
      <Animated.View
        entering={FadeInDown.duration(600).delay(200)}
        style={styles.sectionHeader}
      >
        <Text style={styles.sectionTitle}>Latest Articles</Text>
        <Pressable>
          <Feather name="filter" size={20} color={colors.text.secondary} />
        </Pressable>
      </Animated.View>
    </View>
  );

  const renderArticleItem = ({
    item,
    index,
  }: {
    item: Article;
    index: number;
  }) => {
    const isBookmarked = bookmarkedIds.has(item.id);

    return (
      <Animated.View
        entering={FadeInDown.duration(400).delay(300 + index * 80)}
        layout={Layout.springify()}
      >
        <Pressable
          style={styles.articleItem}
          onPress={() => handleArticlePress(item)}
        >
          {/* Thumbnail */}
          <View style={styles.articleThumbnail}>
            <Feather name="file-text" size={24} color={colors.primary.main} />
          </View>

          {/* Content */}
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
              <View style={styles.articleActions}>
                <View style={styles.readTimeContainer}>
                  <Feather
                    name="clock"
                    size={12}
                    color={colors.text.tertiary}
                  />
                  <Text style={styles.readTimeText}>{item.readTime} min</Text>
                </View>
                <Pressable
                  onPress={() => handleBookmarkPress(item.id)}
                  hitSlop={8}
                >
                  <Feather
                    name="bookmark"
                    size={16}
                    color={
                      isBookmarked ? colors.primary.main : colors.text.tertiary
                    }
                  />
                </Pressable>
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Feather name="book-open" size={64} color={colors.text.tertiary} />
      </View>
      <Text style={styles.emptyTitle}>No articles yet</Text>
      <Text style={styles.emptyDescription}>
        Check back later for healthcare news and investment insights.
      </Text>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.screenTitle}>Research</Text>
        <Pressable style={styles.headerButton}>
          <Feather name="bookmark" size={24} color={colors.text.primary} />
        </Pressable>
      </View>

      {/* Content */}
      <FlatList
        data={regularArticles}
        keyExtractor={(item) => item.id}
        renderItem={renderArticleItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: layout.tabBarHeight + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background.primary,
  },
  screenTitle: {
    ...typography.title,
    color: colors.text.primary,
  },
  headerButton: {
    padding: spacing.xs,
  },

  // Header Content
  headerContent: {
    paddingBottom: spacing.md,
  },

  // Featured Card
  featuredCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface.primary,
    borderRadius: layout.radiusLarge,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.card,
  },
  featuredImagePlaceholder: {
    height: 160,
    backgroundColor: colors.transparent.primary10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredContent: {
    padding: spacing.lg,
  },
  featuredMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    backgroundColor: colors.transparent.primary10,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: layout.radiusSmall,
  },
  categoryBadgeText: {
    ...typography.small,
    color: colors.primary.main,
  },
  featuredTitle: {
    ...typography.heading,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  featuredSummary: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  readTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  readTimeText: {
    ...typography.small,
    color: colors.text.tertiary,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text.primary,
  },

  // List
  listContent: {
    paddingTop: spacing.md,
  },

  // Article Item
  articleItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface.primary,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: layout.radiusMedium,
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
  articleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
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
});
