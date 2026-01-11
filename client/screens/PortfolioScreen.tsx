import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Image,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows, Typography } from "@/constants/theme";
import { storage, Investment } from "@/lib/storage";
import { investmentOpportunities } from "@/lib/mockData";

interface PortfolioItem extends Investment {
  title: string;
  company: string;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

export default function PortfolioScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [investments, setInvestments] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadInvestments = useCallback(async () => {
    try {
      const savedInvestments = await storage.getInvestments();
      const portfolioItems: PortfolioItem[] = savedInvestments.map((inv) => {
        const opportunity = investmentOpportunities.find(
          (opp) => opp.id === inv.opportunityId
        );
        const gainLossPercent = Math.random() * 30 - 5;
        const currentValue = inv.amount * (1 + gainLossPercent / 100);
        return {
          ...inv,
          title: opportunity?.title || "Unknown Investment",
          company: opportunity?.company || "Unknown",
          currentValue,
          gainLoss: currentValue - inv.amount,
          gainLossPercent,
        };
      });
      setInvestments(portfolioItems);
    } catch (error) {
      console.error("Failed to load investments:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvestments();
  }, [loadInvestments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInvestments();
    setRefreshing(false);
  }, [loadInvestments]);

  const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalGainLoss = totalValue - totalInvested;
  const totalGainLossPercent =
    totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

  const renderItem = useCallback(
    ({ item, index }: { item: PortfolioItem; index: number }) => (
      <Animated.View
        entering={FadeInDown.delay(index * 80).springify()}
        style={[styles.investmentCard, { backgroundColor: theme.backgroundDefault }, Shadows.card]}
      >
        <View style={styles.investmentHeader}>
          <View style={styles.investmentInfo}>
            <ThemedText type="heading" numberOfLines={1}>
              {item.title}
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {item.company}
            </ThemedText>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.status === "active"
                    ? Colors.secondary + "15"
                    : Colors.warning + "15",
              },
            ]}
          >
            <ThemedText
              type="small"
              style={{
                color: item.status === "active" ? Colors.secondary : Colors.warning,
                fontWeight: "600",
              }}
            >
              {item.status.toUpperCase()}
            </ThemedText>
          </View>
        </View>

        <View style={styles.investmentMetrics}>
          <View>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Invested
            </ThemedText>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              ${item.amount.toLocaleString()}
            </ThemedText>
          </View>
          <View>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Current Value
            </ThemedText>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              ${item.currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </ThemedText>
          </View>
          <View style={styles.gainLossContainer}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Gain/Loss
            </ThemedText>
            <View style={styles.gainLossRow}>
              <Feather
                name={item.gainLossPercent >= 0 ? "trending-up" : "trending-down"}
                size={14}
                color={item.gainLossPercent >= 0 ? Colors.secondary : Colors.error}
              />
              <ThemedText
                type="body"
                style={{
                  color: item.gainLossPercent >= 0 ? Colors.secondary : Colors.error,
                  fontWeight: "600",
                }}
              >
                {item.gainLossPercent >= 0 ? "+" : ""}
                {item.gainLossPercent.toFixed(1)}%
              </ThemedText>
            </View>
          </View>
        </View>
      </Animated.View>
    ),
    [theme]
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require("../../assets/images/empty-portfolio.png")}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <ThemedText type="heading" style={styles.emptyTitle}>
        Start Your Journey
      </ThemedText>
      <ThemedText
        type="body"
        style={[styles.emptyText, { color: theme.textSecondary }]}
      >
        Your investment portfolio is empty. Discover promising healthcare
        ventures and make your first investment.
      </ThemedText>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <LinearGradient
        colors={[Colors.gradient.start, Colors.gradient.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.summaryCard, Shadows.card]}
      >
        <View style={styles.summaryRow}>
          <View>
            <ThemedText type="body" style={styles.summaryLabel}>
              Total Portfolio Value
            </ThemedText>
            <ThemedText type="hero" style={styles.summaryValue}>
              ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </ThemedText>
          </View>
          <View style={styles.performanceContainer}>
            <View
              style={[
                styles.performanceBadge,
                {
                  backgroundColor:
                    totalGainLossPercent >= 0
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(220,38,38,0.3)",
                },
              ]}
            >
              <Feather
                name={totalGainLossPercent >= 0 ? "trending-up" : "trending-down"}
                size={16}
                color="#FFFFFF"
              />
              <ThemedText type="body" style={styles.performanceText}>
                {totalGainLossPercent >= 0 ? "+" : ""}
                {totalGainLossPercent.toFixed(1)}%
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <ThemedText type="small" style={styles.statLabel}>
              Total Invested
            </ThemedText>
            <ThemedText type="heading" style={styles.statValue}>
              ${totalInvested.toLocaleString()}
            </ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText type="small" style={styles.statLabel}>
              Total Gain/Loss
            </ThemedText>
            <ThemedText type="heading" style={styles.statValue}>
              {totalGainLoss >= 0 ? "+" : ""}$
              {Math.abs(totalGainLoss).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText type="small" style={styles.statLabel}>
              Investments
            </ThemedText>
            <ThemedText type="heading" style={styles.statValue}>
              {investments.length}
            </ThemedText>
          </View>
        </View>
      </LinearGradient>

      {investments.length > 0 ? (
        <ThemedText type="heading" style={styles.sectionTitle}>
          Your Investments
        </ThemedText>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View
        style={[
          styles.screenHeader,
          { paddingTop: insets.top + Spacing.lg },
        ]}
      >
        <ThemedText type="title">Portfolio</ThemedText>
        <Pressable hitSlop={8}>
          <Feather name="bell" size={22} color={theme.text} />
        </Pressable>
      </View>

      <FlatList
        data={investments}
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
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
      />
    </View>
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
  headerSection: {
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xl,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.xl,
  },
  summaryLabel: {
    color: "rgba(255,255,255,0.8)",
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    color: "#FFFFFF",
  },
  performanceContainer: {
    alignItems: "flex-end",
  },
  performanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  performanceText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  statLabel: {
    color: "rgba(255,255,255,0.7)",
    marginBottom: Spacing.xs,
  },
  statValue: {
    color: "#FFFFFF",
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  investmentCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  investmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  investmentInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  investmentMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  gainLossContainer: {
    alignItems: "flex-end",
  },
  gainLossRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
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
