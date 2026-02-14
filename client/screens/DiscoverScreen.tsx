import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  ScrollView,
  Pressable,
  RefreshControl,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows, Typography } from "@/constants/theme";
import {
  investmentOpportunities,
  categories,
  InvestmentOpportunity,
} from "@/lib/mockData";
import { DiscoverStackParamList } from "@/navigation/DiscoverStackNavigator";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<DiscoverStackParamList>>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const filteredOpportunities = investmentOpportunities.filter((opp) => {
    const matchesSearch =
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || opp.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: InvestmentOpportunity; index: number }) => (
      <InvestmentCard
        opportunity={item}
        index={index}
        onPress={() => navigation.navigate("InvestmentDetail", { id: item.id })}
      />
    ),
    [navigation]
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require("../../assets/images/empty-discover.png")}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <ThemedText type="heading" style={styles.emptyTitle}>
        No opportunities found
      </ThemedText>
      <ThemedText
        type="body"
        style={[styles.emptyText, { color: theme.textSecondary }]}
      >
        Try adjusting your search or filters to discover new investment
        opportunities
      </ThemedText>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + Spacing.lg,
            backgroundColor: theme.backgroundRoot,
          },
        ]}
      >
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search opportunities..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
          style={styles.categoriesContainer}
        >
          {categories.map((cat) => (
            <CategoryChip
              key={cat.id}
              label={cat.name}
              selected={selectedCategory === cat.id}
              onPress={() => setSelectedCategory(cat.id)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredOpportunities}
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
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

function CategoryChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? Colors.primary : theme.backgroundSecondary,
        },
      ]}
    >
      <ThemedText
        type="caption"
        style={[
          styles.chipText,
          { color: selected ? "#FFFFFF" : theme.text },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

function InvestmentCard({
  opportunity,
  index,
  onPress,
}: {
  opportunity: InvestmentOpportunity;
  index: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const progress =
    (opportunity.fundingRaised / opportunity.fundingGoal) * 100;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const getRiskColor = () => {
    switch (opportunity.riskLevel) {
      case "low":
        return Colors.secondary;
      case "medium":
        return Colors.warning;
      case "high":
        return Colors.error;
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
    >
      <Animated.View
        entering={FadeInDown.delay(index * 80).springify()}
        style={[styles.card, Shadows.card]}
      >
        <LinearGradient
          colors={[Colors.gradient.start, Colors.gradient.end]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardHeader}>
            <View style={styles.categoryBadge}>
              <ThemedText type="small" style={styles.categoryText}>
                {opportunity.category.replace("-", " ").toUpperCase()}
              </ThemedText>
            </View>
            <View
              style={[styles.riskBadge, { backgroundColor: getRiskColor() + "30" }]}
            >
              <ThemedText
                type="small"
                style={[styles.riskText, { color: getRiskColor() }]}
              >
                {opportunity.riskLevel.toUpperCase()} RISK
              </ThemedText>
            </View>
          </View>

          <ThemedText type="heading" style={styles.cardTitle}>
            {opportunity.title}
          </ThemedText>
          <ThemedText type="caption" style={styles.cardCompany}>
            {opportunity.company}
          </ThemedText>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]}
              />
            </View>
            <View style={styles.progressLabels}>
              <ThemedText type="small" style={styles.progressText}>
                ${(opportunity.fundingRaised / 1000000).toFixed(1)}M raised
              </ThemedText>
              <ThemedText type="small" style={styles.progressText}>
                ${(opportunity.fundingGoal / 1000000).toFixed(0)}M goal
              </ThemedText>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.footerItem}>
              <Feather name="clock" size={14} color="#FFFFFF" />
              <ThemedText type="small" style={styles.footerText}>
                {opportunity.daysRemaining} days left
              </ThemedText>
            </View>
            <View style={styles.footerItem}>
              <Feather name="trending-up" size={14} color="#FFFFFF" />
              <ThemedText type="small" style={styles.footerText}>
                {opportunity.expectedROI} ROI
              </ThemedText>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    zIndex: 10,
    elevation: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    height: 48,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
  },
  categoriesContainer: {
    marginTop: Spacing.md,
  },
  categoriesContent: {
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  chipText: {
    fontWeight: "500",
  },
  listContent: {
    padding: Spacing.xl,
    paddingTop: Spacing.md,
    gap: Spacing.lg,
  },
  card: {
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  cardGradient: {
    padding: Spacing.xl,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  categoryBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  categoryText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  riskBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  riskText: {
    fontWeight: "600",
  },
  cardTitle: {
    color: "#FFFFFF",
    marginBottom: Spacing.xs,
  },
  cardCompany: {
    color: "rgba(255,255,255,0.8)",
    marginBottom: Spacing.lg,
  },
  progressContainer: {
    marginBottom: Spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  progressText: {
    color: "rgba(255,255,255,0.9)",
  },
  cardFooter: {
    flexDirection: "row",
    gap: Spacing.xl,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  footerText: {
    color: "#FFFFFF",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["5xl"],
    paddingHorizontal: Spacing.xl,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
  },
});
