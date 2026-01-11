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
  // Fetch news
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
      // Navigate to full news screen or open browser
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
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Discover More News</ThemedText>
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

// Individual news item
interface NewsListItemProps {
  item: NewsItem;
  onPress: () => void;
}

function NewsListItem({ item, onPress }: NewsListItemProps) {
  // Format date for display
  const formattedDate = formatNewsDate(item.published_at);

  return (
    <TouchableOpacity style={styles.newsItem} onPress={onPress}>
      {/* Source Icon */}
      <View style={styles.sourceIconContainer}>
        {item.source_icon ? (
          <Image source={{ uri: item.source_icon }} style={styles.sourceIcon} />
        ) : (
          <View style={[styles.sourceIcon, styles.sourceIconPlaceholder]}>
            <Ionicons name="newspaper-outline" size={16} color={Colors.error} />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.newsContent}>
        <ThemedText style={styles.newsTitle} numberOfLines={2}>
          {item.title}
        </ThemedText>
        {item.category && (
          <ThemedText style={styles.newsCategory}>{item.category}</ThemedText>
        )}
      </View>
    </TouchableOpacity>
  );
}

// Helper to format news date
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

// News card with image (for featured news)
interface FeaturedNewsCardProps {
  item: NewsItem;
  onPress: () => void;
}

export function FeaturedNewsCard({ item, onPress }: FeaturedNewsCardProps) {
  return (
    <TouchableOpacity style={styles.featuredCard} onPress={onPress}>
      {item.image_url && (
        <Image source={{ uri: item.image_url }} style={styles.featuredImage} />
      )}
      <View style={styles.featuredContent}>
        <View style={styles.featuredMeta}>
          <ThemedText style={styles.featuredSource}>{item.source}</ThemedText>
          <ThemedText style={styles.featuredDate}>
            {formatNewsDate(item.published_at)}
          </ThemedText>
        </View>
        <ThemedText style={styles.featuredTitle} numberOfLines={2}>
          {item.title}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

// Compact version for sidebar
export function DiscoverNewsCompact({ limit = 5 }: { limit?: number }) {
  return (
    <View style={styles.compactContainer}>
      <DiscoverMoreNews limit={limit} showHeader={true} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
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
    color: Colors.textPrimary,
  },
  newsList: {
    paddingHorizontal: Spacing.lg,
  },
  newsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
    backgroundColor: Colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsContent: {
    flex: 1,
  },
  newsTitle: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  newsCategory: {
    ...Typography.small,
    color: Colors.textSecondary,
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

  // Featured card
  featuredCard: {
    backgroundColor: Colors.surface,
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
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  featuredTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 22,
  },

  // Compact container
  compactContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.card,
  },
});
