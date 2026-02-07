import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { useAppColors } from '@/hooks/useAppColors';
import { articles, Article } from "@/lib/mockData";
import { storage } from "@/lib/storage";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ResearchScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const appColors = useAppColors();
  const [refreshing, setRefreshing] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  React.useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    const bookmarks = await storage.getBookmarks();
    setBookmarkedIds(bookmarks);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleBookmark = async (articleId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const isNowBookmarked = await storage.toggleBookmark(articleId);
    if (isNowBookmarked) {
      setBookmarkedIds((prev) => [...prev, articleId]);
    } else {
      setBookmarkedIds((prev) => prev.filter((id) => id !== articleId));
    }
  };

  const featuredArticle = articles.find((a) => a.featured);
  const regularArticles = articles.filter((a) => !a.featured);

  const renderFeaturedArticle = () => {
    if (!featuredArticle) return null;

    return (
      <Animated.View
        entering={FadeInDown.springify()}
        style={[
          styles.featuredCard,
          { backgroundColor: theme.backgroundDefault },
          Shadows.card,
        ]}
      >
        <View
          style={[styles.featuredImagePlaceholder, { backgroundColor: Colors.primary + "15" }]}
        >
          <Feather name="file-text" size={48} color={Colors.primary} />
        </View>
        <View style={styles.featuredContent}>
          <View style={styles.featuredMeta}>
            <View style={[styles.categoryTag, { backgroundColor: Colors.primary + "15" }]}>
              <ThemedText type="small" style={{ color: Colors.primary, fontWeight: "600" }}>
                {featuredArticle.category}
              </ThemedText>
            </View>
            <Pressable
              onPress={() => handleBookmark(featuredArticle.id)}
              hitSlop={8}
            >
              <Feather
                name={bookmarkedIds.includes(featuredArticle.id) ? "bookmark" : "bookmark"}
                size={20}
                color={
                  bookmarkedIds.includes(featuredArticle.id)
                    ? Colors.primary
                    : theme.textSecondary
                }
              />
            </Pressable>
          </View>
          <ThemedText type="heading" style={styles.featuredTitle}>
            {featuredArticle.title}
          </ThemedText>
          <View style={styles.articleMeta}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {featuredArticle.source}
            </ThemedText>
            <View style={[styles.metaDot, { backgroundColor: appColors.border }]} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {featuredArticle.publishedAt}
            </ThemedText>
            <View style={[styles.metaDot, { backgroundColor: appColors.border }]} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {featuredArticle.readTime}
            </ThemedText>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderItem = useCallback(
    ({ item, index }: { item: Article; index: number }) => (
      <ArticleCard
        article={item}
        index={index}
        isBookmarked={bookmarkedIds.includes(item.id)}
        onBookmark={() => handleBookmark(item.id)}
      />
    ),
    [bookmarkedIds]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View
        style={[
          styles.screenHeader,
          { paddingTop: insets.top + Spacing.lg },
        ]}
      >
        <ThemedText type="title">Research</ThemedText>
        <Pressable hitSlop={8}>
          <Feather name="bookmark" size={22} color={theme.text} />
        </Pressable>
      </View>

      <FlatList
        data={regularArticles}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
            {renderFeaturedArticle()}
            <ThemedText type="heading" style={styles.sectionTitle}>
              Latest News
            </ThemedText>
          </>
        }
      />
    </View>
  );
}

function ArticleCard({
  article,
  index,
  isBookmarked,
  onBookmark,
}: {
  article: Article;
  index: number;
  isBookmarked: boolean;
  onBookmark: () => void;
}) {
  const { theme } = useTheme();
  const appColors = useAppColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
    >
      <Animated.View
        entering={FadeInDown.delay(index * 60).springify()}
        style={[
          styles.articleCard,
          { backgroundColor: theme.backgroundDefault },
          Shadows.card,
        ]}
      >
        <View
          style={[styles.articleThumbnail, { backgroundColor: Colors.primary + "10" }]}
        >
          <Feather name="file-text" size={24} color={Colors.primary} />
        </View>
        <View style={styles.articleContent}>
          <View style={styles.articleHeader}>
            <View style={[styles.smallCategoryTag, { backgroundColor: Colors.primary + "15" }]}>
              <ThemedText type="small" style={{ color: Colors.primary, fontWeight: "500" }}>
                {article.category}
              </ThemedText>
            </View>
            <Pressable onPress={onBookmark} hitSlop={8}>
              <Feather
                name="bookmark"
                size={16}
                color={isBookmarked ? Colors.primary : theme.textSecondary}
              />
            </Pressable>
          </View>
          <ThemedText type="body" numberOfLines={2} style={styles.articleTitle}>
            {article.title}
          </ThemedText>
          <View style={styles.articleMeta}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {article.source}
            </ThemedText>
            <View style={[styles.metaDot, { backgroundColor: appColors.border }]} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {article.publishedAt}
            </ThemedText>
          </View>
        </View>
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  listContent: {
    padding: Spacing.xl,
    paddingTop: 0,
  },
  featuredCard: {
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    marginBottom: Spacing.xl,
  },
  featuredImagePlaceholder: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  featuredContent: {
    padding: Spacing.lg,
  },
  featuredMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  categoryTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  featuredTitle: {
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  articleCard: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  articleThumbnail: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  articleContent: {
    flex: 1,
  },
  articleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  smallCategoryTag: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  articleTitle: {
    marginBottom: Spacing.xs,
  },
  articleMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: Spacing.sm,
  },
});
