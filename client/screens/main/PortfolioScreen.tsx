import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  FadeIn,
  FadeInDown,
  Layout,
} from 'react-native-reanimated';

import { colors, typography, spacing, layout, shadows } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

// Types
interface PortfolioInvestment {
  id: string;
  name: string;
  category: string;
  amountInvested: number;
  currentValue: number;
  gainLossPercent: number;
  status: 'active' | 'completed' | 'pending';
}

interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  totalGainLoss: number;
  gainLossPercent: number;
  activeInvestments: number;
}

// Mock data
const MOCK_SUMMARY: PortfolioSummary = {
  totalValue: 125750,
  totalInvested: 100000,
  totalGainLoss: 25750,
  gainLossPercent: 25.75,
  activeInvestments: 5,
};

const MOCK_INVESTMENTS: PortfolioInvestment[] = [
  {
    id: '1',
    name: 'NeuroLink Diagnostics',
    category: 'Digital Health',
    amountInvested: 25000,
    currentValue: 32500,
    gainLossPercent: 30.0,
    status: 'active',
  },
  {
    id: '2',
    name: 'CardioSense Implant',
    category: 'Medical Devices',
    amountInvested: 35000,
    currentValue: 42000,
    gainLossPercent: 20.0,
    status: 'active',
  },
  {
    id: '3',
    name: 'GeneCure Therapeutics',
    category: 'Biotech',
    amountInvested: 20000,
    currentValue: 27000,
    gainLossPercent: 35.0,
    status: 'active',
  },
  {
    id: '4',
    name: 'MindWell App',
    category: 'Digital Health',
    amountInvested: 10000,
    currentValue: 12250,
    gainLossPercent: 22.5,
    status: 'active',
  },
  {
    id: '5',
    name: 'PharmaTech Solutions',
    category: 'Pharmaceuticals',
    amountInvested: 10000,
    currentValue: 12000,
    gainLossPercent: 20.0,
    status: 'pending',
  },
];

/**
 * Portfolio Screen
 * Track investments and returns
 */
export default function PortfolioScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [refreshing, setRefreshing] = useState(false);
  const [summary] = useState<PortfolioSummary>(MOCK_SUMMARY);
  const [investments] = useState<PortfolioInvestment[]>(MOCK_INVESTMENTS);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const handleInvestmentPress = useCallback(
    (investment: PortfolioInvestment) => {
      navigation.navigate('InvestmentDetail', { investmentId: investment.id });
    },
    [navigation]
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Total Value Card */}
      <Animated.View entering={FadeInDown.duration(600).delay(100)}>
        <LinearGradient
          colors={colors.gradient.colors as unknown as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryLabel}>Total Portfolio Value</Text>
            <Pressable style={styles.notificationButton}>
              <Feather name="bell" size={20} color={colors.text.inverse} />
            </Pressable>
          </View>

          <Text style={styles.summaryValue}>
            {formatCurrency(summary.totalValue)}
          </Text>

          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <View
                style={[
                  styles.gainLossBadge,
                  summary.gainLossPercent >= 0
                    ? styles.gainBadge
                    : styles.lossBadge,
                ]}
              >
                <Feather
                  name={summary.gainLossPercent >= 0 ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={colors.text.inverse}
                />
                <Text style={styles.gainLossText}>
                  {summary.gainLossPercent >= 0 ? '+' : ''}
                  {summary.gainLossPercent.toFixed(2)}%
                </Text>
              </View>
              <Text style={styles.statLabel}>All Time</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.summaryStat}>
              <Text style={styles.statValue}>
                {formatCurrency(summary.totalGainLoss)}
              </Text>
              <Text style={styles.statLabel}>Total Returns</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.summaryStat}>
              <Text style={styles.statValue}>{summary.activeInvestments}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Section Header */}
      <Animated.View
        entering={FadeInDown.duration(600).delay(200)}
        style={styles.sectionHeader}
      >
        <Text style={styles.sectionTitle}>Your Investments</Text>
        <Pressable>
          <Text style={styles.seeAllLink}>See All</Text>
        </Pressable>
      </Animated.View>
    </View>
  );

  const renderInvestmentItem = ({
    item,
    index,
  }: {
    item: PortfolioInvestment;
    index: number;
  }) => {
    const isPositive = item.gainLossPercent >= 0;

    return (
      <Animated.View
        entering={FadeInDown.duration(400).delay(300 + index * 80)}
        layout={Layout.springify()}
      >
        <Pressable
          style={styles.investmentItem}
          onPress={() => handleInvestmentPress(item)}
        >
          <View style={styles.investmentLeft}>
            <View style={styles.investmentIcon}>
              <Feather
                name="activity"
                size={20}
                color={colors.primary.main}
              />
            </View>
            <View style={styles.investmentInfo}>
              <Text style={styles.investmentName}>{item.name}</Text>
              <Text style={styles.investmentCategory}>{item.category}</Text>
            </View>
          </View>

          <View style={styles.investmentRight}>
            <Text style={styles.investmentValue}>
              {formatCurrency(item.currentValue)}
            </Text>
            <View style={styles.gainLossRow}>
              <Feather
                name={isPositive ? 'arrow-up-right' : 'arrow-down-right'}
                size={14}
                color={
                  isPositive
                    ? colors.semantic.success
                    : colors.semantic.error
                }
              />
              <Text
                style={[
                  styles.gainLossPercent,
                  isPositive ? styles.positive : styles.negative,
                ]}
              >
                {isPositive ? '+' : ''}
                {item.gainLossPercent.toFixed(1)}%
              </Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Feather name="bar-chart-2" size={64} color={colors.text.tertiary} />
      </View>
      <Text style={styles.emptyTitle}>No investments yet</Text>
      <Text style={styles.emptyDescription}>
        Start building your portfolio by exploring investment opportunities.
      </Text>
      <Pressable style={styles.emptyButton}>
        <LinearGradient
          colors={colors.gradient.colors as unknown as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.emptyButtonGradient}
        >
          <Text style={styles.emptyButtonText}>Explore Investments</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.screenTitle}>Portfolio</Text>
      </View>

      {/* Content */}
      <FlatList
        data={investments}
        keyExtractor={(item) => item.id}
        renderItem={renderInvestmentItem}
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background.primary,
  },
  screenTitle: {
    ...typography.title,
    color: colors.text.primary,
  },

  // Header Content
  headerContent: {
    paddingBottom: spacing.md,
  },

  // Summary Card
  summaryCard: {
    marginHorizontal: spacing.lg,
    padding: spacing.xl,
    borderRadius: layout.radiusXLarge,
    ...shadows.elevated,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.transparent.white50,
  },
  notificationButton: {
    padding: spacing.xs,
  },
  summaryValue: {
    ...typography.hero,
    fontSize: 40,
    color: colors.text.inverse,
    marginBottom: spacing.lg,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.transparent.white20,
  },
  gainLossBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: layout.radiusSmall,
    marginBottom: spacing.xs,
  },
  gainBadge: {
    backgroundColor: 'rgba(0, 168, 107, 0.3)',
  },
  lossBadge: {
    backgroundColor: 'rgba(220, 38, 38, 0.3)',
  },
  gainLossText: {
    ...typography.captionMedium,
    color: colors.text.inverse,
  },
  statValue: {
    ...typography.heading,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.small,
    color: colors.transparent.white50,
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
  seeAllLink: {
    ...typography.captionMedium,
    color: colors.primary.main,
  },

  // List
  listContent: {
    paddingTop: spacing.md,
  },

  // Investment Item
  investmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    borderRadius: layout.radiusMedium,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  investmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  investmentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.transparent.primary10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  investmentInfo: {
    flex: 1,
  },
  investmentName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  investmentCategory: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  investmentRight: {
    alignItems: 'flex-end',
  },
  investmentValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  gainLossRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  gainLossPercent: {
    ...typography.captionMedium,
  },
  positive: {
    color: colors.semantic.success,
  },
  negative: {
    color: colors.semantic.error,
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
    marginBottom: spacing.xl,
  },
  emptyButton: {
    borderRadius: layout.radiusMedium,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  emptyButtonText: {
    ...typography.button.medium,
    color: colors.text.inverse,
  },
});
