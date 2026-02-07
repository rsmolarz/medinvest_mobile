/**
 * Discover More News Component
 * News feed with healthcare/medical industry news
 */

import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { newsApi } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';

interface NewsItem {
  id: number;
  title: string;
  source: string;
  source_icon?: string;
  url: string;
  published_at: string;
  category?: string;
  image_url?: string;
}

interface DiscoverMoreNewsProps {
  limit?: number;
  showHeader?: boolean;
  onViewAll?: () => void;
}

export default function DiscoverMoreNews({
  limit = 7,
  showHeader = true,
  onViewAll,
}: DiscoverMoreNewsProps) {
  const appColors = useAppColors();

  const { data: news, isLoading } = useQuery({
    queryKey: ['news', limit],
    queryFn: async () => {
      const response = await newsApi.getLatestNews(limit);
      return response.data?.articles || [];
    },
  });

  const handleNewsPress = useCallback((url: string) => {
    Linking.openURL(url);
  }, []);

  const handleViewAll = useCallback(() => {
    if (onViewAll) {
      onViewAll();
    } else {
      Linking.openURL('https://medinvest.com/news');
    }
  }, [onViewAll]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  if (!news || news.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: appColors.surface }]}>
      {showHeader && (
        <View style={styles.header}>
          <ThemedText style={[styles.headerTitle, { color: appColors.textPrimary }]}>Discover More News</ThemedText>
        </View>
      )}

      <View style={styles.newsList}>
        {news.map((item: NewsItem) => (
          <NewsListItem
            key={item.id}
            item={item}
            onPress={() => handleNewsPress(item.url)}
          />
        ))}
      </View>

      {onViewAll && (
        <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
          <ThemedText style={styles.viewAllText}>View all news</ThemedText>
          <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

interface NewsListItemProps {
  item: NewsItem;
  onPress: () => void;
}

function NewsListItem({ item, onPress }: NewsListItemProps) {
  const appColors = useAppColors();
  const formattedDate = formatNewsDate(item.published_at);

  return (
    <TouchableOpacity style={[styles.newsItem, { borderBottomColor: appColors.border }]} onPress={onPress}>
      {/* Source Icon */}
      <View style={styles.sourceIconContainer}>
        {item.source_icon ? (
          <Image source={{ uri: item.source_icon }} style={styles.sourceIcon} />
        ) : (
          <View style={[styles.sourceIcon, styles.sourceIconPlaceholder, { backgroundColor: appColors.error + '15' }]}>
            <Ionicons name="newspaper-outline" size={16} color={appColors.error} />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.newsContent}>
        <ThemedText style={[styles.newsTitle, { color: appColors.textPrimary }]} numberOfLines={2}>
          {item.title}
        </ThemedText>
        {item.category && (
          <ThemedText style={[styles.newsCategory, { color: appColors.textSecondary }]}>{item.category}</ThemedText>
        )}
      </View>
    </TouchableOpacity>
  );
}

function formatNewsDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }
}

interface FeaturedNewsCardProps {
  item: NewsItem;
  onPress: () => void;
}

export function FeaturedNewsCard({ item, onPress }: FeaturedNewsCardProps) {
  const appColors = useAppColors();
  return (
    <TouchableOpacity style={[styles.featuredCard, { backgroundColor: appColors.surface }]} onPress={onPress}>
      {item.image_url && (
        <Image source={{ uri: item.image_url }} style={styles.featuredImage} />
      )}
      <View style={styles.featuredContent}>
        <View style={styles.featuredMeta}>
          <ThemedText style={styles.featuredSource}>{item.source}</ThemedText>
          <ThemedText style={[styles.featuredDate, { color: appColors.textSecondary }]}>
            {formatNewsDate(item.published_at)}
          </ThemedText>
        </View>
        <ThemedText style={[styles.featuredTitle, { color: appColors.textPrimary }]} numberOfLines={2}>
          {item.title}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

export function DiscoverNewsCompact({ limit = 5 }: { limit?: number }) {
  const appColors = useAppColors();
  return (
    <View style={[styles.compactContainer, { backgroundColor: appColors.surface }]}>
      <DiscoverMoreNews limit={limit} showHeader={true} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    ...Typography.body,
    fontWeight: '600',
  },
  newsList: {
    paddingHorizontal: Spacing.lg,
  },
  newsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  sourceIconContainer: {
    marginRight: Spacing.md,
  },
  sourceIcon: {
    width: 32,
    height: 32,
    borderRadius: 4,
  },
  sourceIconPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsContent: {
    flex: 1,
  },
  newsTitle: {
    ...Typography.body,
    lineHeight: 22,
  },
  newsCategory: {
    ...Typography.small,
    marginTop: 4,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.xs,
  },
  viewAllText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },

  featuredCard: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.card,
  },
  featuredImage: {
    width: '100%',
    height: 160,
  },
  featuredContent: {
    padding: Spacing.md,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  featuredSource: {
    ...Typography.small,
    color: Colors.primary,
    fontWeight: '600',
  },
  featuredDate: {
    ...Typography.small,
    marginLeft: Spacing.sm,
  },
  featuredTitle: {
    ...Typography.body,
    fontWeight: '600',
    lineHeight: 22,
  },

  compactContainer: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.card,
  },
});
