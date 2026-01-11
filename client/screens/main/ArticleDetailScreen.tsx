import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';

import { colors, typography, spacing, layout } from '@/theme';
import { Badge, Button, Skeleton, SkeletonText } from '@/components';
import { useArticleDetail, useToggleBookmark } from '@/api';
import { useToast } from '@/components/Toast';

interface ArticleDetailScreenProps {
  route: {
    params: {
      articleId: string;
    };
  };
  navigation: any;
}

export default function ArticleDetailScreen({
  route,
  navigation,
}: ArticleDetailScreenProps) {
  const { articleId } = route.params;
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const { data: article, isLoading, error } = useArticleDetail(articleId);
  const toggleBookmark = useToggleBookmark();

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleBookmark = useCallback(async () => {
    if (!article) return;

    try {
      await toggleBookmark.mutateAsync(articleId);
      toast.success(
        article.isBookmarked ? 'Removed from saved' : 'Article saved'
      );
    } catch {
      toast.error('Failed to update bookmark');
    }
  }, [article, articleId, toggleBookmark, toast]);

  const handleShare = useCallback(async () => {
    if (!article) return;

    try {
      await Share.share({
        title: article.title,
        message: `${article.title}\n\nRead more: ${article.sourceUrl || 'https://medinvest.app'}`,
      });
    } catch {
      // User cancelled or error
    }
  }, [article]);

  const handleOpenSource = useCallback(() => {
    if (article?.sourceUrl) {
      Linking.openURL(article.sourceUrl);
    }
  }, [article]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={colors.text.primary} />
          </Pressable>
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Skeleton width="100%" height={220} borderRadius={0} />
          <View style={styles.articleContent}>
            <Skeleton width={80} height={24} style={styles.categoryBadge} />
            <Skeleton width="90%" height={28} style={styles.titleSkeleton} />
            <Skeleton width="60%" height={28} />
            <View style={styles.metaRow}>
              <Skeleton width={100} height={16} />
              <Skeleton width={80} height={16} />
            </View>
            <View style={styles.bodySkeleton}>
              <SkeletonText lines={4} />
              <View style={{ height: spacing.lg }} />
              <SkeletonText lines={5} />
              <View style={{ height: spacing.lg }} />
              <SkeletonText lines={3} />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (error || !article) {
    return (
      <View style={[styles.container, styles.errorContainer, { paddingTop: insets.top }]}>
        <Feather name="alert-circle" size={48} color={colors.text.tertiary} />
        <Text style={styles.errorTitle}>Unable to load article</Text>
        <Text style={styles.errorMessage}>
          Something went wrong. Please try again.
        </Text>
        <Button variant="outline" onPress={handleBack} leftIcon="arrow-left">
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton} hitSlop={8}>
          <Feather name="arrow-left" size={24} color={colors.text.primary} />
        </Pressable>
        
        <View style={styles.headerActions}>
          <Pressable
            onPress={handleBookmark}
            style={styles.actionButton}
            hitSlop={8}
          >
            <Feather
              name={article.isBookmarked ? 'bookmark' : 'bookmark'}
              size={22}
              color={article.isBookmarked ? colors.primary.main : colors.text.primary}
              style={article.isBookmarked ? { fill: colors.primary.main } : undefined}
            />
          </Pressable>
          
          <Pressable onPress={handleShare} style={styles.actionButton} hitSlop={8}>
            <Feather name="share" size={22} color={colors.text.primary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
      >
        {/* Hero Image */}
        {article.imageUrl && (
          <Animated.View entering={FadeIn.duration(400)}>
            <Image
              source={{ uri: article.imageUrl }}
              style={styles.heroImage}
              contentFit="cover"
              transition={300}
            />
          </Animated.View>
        )}

        <Animated.View
          style={styles.articleContent}
          entering={FadeInDown.delay(200).duration(400)}
        >
          {/* Category & Featured Badge */}
          <View style={styles.badgeRow}>
            <Badge variant="primary">{article.category}</Badge>
            {article.isFeatured && (
              <Badge variant="warning" icon="star">
                Featured
              </Badge>
            )}
          </View>

          {/* Title */}
          <Text style={styles.title}>{article.title}</Text>

          {/* Meta Info */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="calendar" size={14} color={colors.text.tertiary} />
              <Text style={styles.metaText}>
                {formatDate(article.publishedAt)}
              </Text>
            </View>
            
            <View style={styles.metaItem}>
              <Feather name="clock" size={14} color={colors.text.tertiary} />
              <Text style={styles.metaText}>{article.readTime} min read</Text>
            </View>
            
            <View style={styles.metaItem}>
              <Feather name="eye" size={14} color={colors.text.tertiary} />
              <Text style={styles.metaText}>
                {article.viewCount.toLocaleString()} views
              </Text>
            </View>
          </View>

          {/* Author & Source */}
          <View style={styles.sourceRow}>
            <View style={styles.sourceInfo}>
              <View style={styles.sourceIcon}>
                <Feather name="edit-3" size={16} color={colors.primary.main} />
              </View>
              <View>
                {article.author && (
                  <Text style={styles.authorName}>{article.author}</Text>
                )}
                <Text style={styles.sourceName}>{article.source}</Text>
              </View>
            </View>
            
            {article.sourceUrl && (
              <Pressable onPress={handleOpenSource} style={styles.sourceLink}>
                <Text style={styles.sourceLinkText}>View Source</Text>
                <Feather
                  name="external-link"
                  size={14}
                  color={colors.primary.main}
                />
              </Pressable>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Summary */}
          <Text style={styles.summary}>{article.summary}</Text>

          {/* Content */}
          {article.content && (
            <Text style={styles.body}>{article.content}</Text>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.tagsLabel}>Topics</Text>
              <View style={styles.tagsContainer}>
                {article.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" size="sm">
                    {tag}
                  </Badge>
                ))}
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          variant="primary"
          onPress={handleBookmark}
          leftIcon={article.isBookmarked ? 'check' : 'bookmark'}
          fullWidth
        >
          {article.isBookmarked ? 'Saved to Library' : 'Save Article'}
        </Button>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.xs,
  },

  // Content
  content: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    height: 220,
    backgroundColor: colors.background.secondary,
  },
  articleContent: {
    padding: spacing.lg,
  },

  // Badges
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  // Title
  title: {
    ...typography.largeTitle,
    color: colors.text.primary,
    marginBottom: spacing.md,
    lineHeight: 36,
  },

  // Meta
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },

  // Source
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: layout.radiusMedium,
    marginBottom: spacing.lg,
  },
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.transparent.primary10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: {
    ...typography.captionMedium,
    color: colors.text.primary,
  },
  sourceName: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sourceLinkText: {
    ...typography.caption,
    color: colors.primary.main,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginBottom: spacing.lg,
  },

  // Body
  summary: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
    lineHeight: 26,
    marginBottom: spacing.lg,
  },
  body: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 26,
  },

  // Tags
  tagsSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  tagsLabel: {
    ...typography.captionMedium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  // Bottom Bar
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },

  // Skeleton
  categoryBadge: {
    marginBottom: spacing.md,
  },
  titleSkeleton: {
    marginBottom: spacing.sm,
  },
  bodySkeleton: {
    marginTop: spacing.lg,
  },

  // Error
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    ...typography.heading,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});
