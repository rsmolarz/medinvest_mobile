import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  RefreshControl,
  Image,
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
interface Investment {
  id: string;
  name: string;
  description: string;
  category: string;
  fundingGoal: number;
  fundingCurrent: number;
  expectedROI: string;
  daysRemaining: number;
  imageUrl?: string;
  riskLevel: 'Low' | 'Medium' | 'High';
}

interface Category {
  id: string;
  name: string;
  icon: keyof typeof Feather.glyphMap;
}

// Mock data
const CATEGORIES: Category[] = [
  { id: '1', name: 'All', icon: 'grid' },
  { id: '2', name: 'Biotech', icon: 'activity' },
  { id: '3', name: 'Medical Devices', icon: 'cpu' },
  { id: '4', name: 'Digital Health', icon: 'smartphone' },
  { id: '5', name: 'Pharmaceuticals', icon: 'package' },
  { id: '6', name: 'Research', icon: 'search' },
];

const MOCK_INVESTMENTS: Investment[] = [
  {
    id: '1',
    name: 'NeuroLink Diagnostics',
    description: 'AI-powered early detection of neurological disorders',
    category: 'Digital Health',
    fundingGoal: 2500000,
    fundingCurrent: 1875000,
    expectedROI: '15-22%',
    daysRemaining: 45,
    riskLevel: 'Medium',
  },
  {
    id: '2',
    name: 'CardioSense Implant',
    description: 'Next-gen cardiac monitoring implant with 10-year battery',
    category: 'Medical Devices',
    fundingGoal: 5000000,
    fundingCurrent: 3250000,
    expectedROI: '18-25%',
    daysRemaining: 30,
    riskLevel: 'Medium',
  },
  {
    id: '3',
    name: 'GeneCure Therapeutics',
    description: 'CRISPR-based treatment for rare genetic diseases',
    category: 'Biotech',
    fundingGoal: 10000000,
    fundingCurrent: 4500000,
    expectedROI: '25-35%',
    daysRemaining: 60,
    riskLevel: 'High',
  },
  {
    id: '4',
    name: 'MindWell App',
    description: 'Mental health platform with AI therapy assistance',
    category: 'Digital Health',
    fundingGoal: 1000000,
    fundingCurrent: 850000,
    expectedROI: '12-18%',
    daysRemaining: 15,
    riskLevel: 'Low',
  },
];

/**
 * Discover Screen
 * Browse investment opportunities
 */
export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('1');
  const [refreshing, setRefreshing] = useState(false);
  const [investments] = useState<Investment[]>(MOCK_INVESTMENTS);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // TODO: Fetch investments from API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const handleInvestmentPress = useCallback(
    (investment: Investment) => {
      navigation.navigate('InvestmentDetail', { investmentId: investment.id });
    },
    [navigation]
  );

  const filteredInvestments = investments.filter((inv) => {
    const matchesSearch = inv.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === '1' ||
      CATEGORIES.find((c) => c.id === selectedCategory)?.name === inv.category;
    return matchesSearch && matchesCategory;
  });

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Feather
          name="search"
          size={20}
          color={colors.text.secondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search investments..."
          placeholderTextColor={colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Feather name="x" size={20} color={colors.text.secondary} />
          </Pressable>
        )}
        <Pressable style={styles.filterButton}>
          <Feather name="sliders" size={20} color={colors.primary.main} />
        </Pressable>
      </View>

      {/* Category Chips */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.categoryChip,
              selectedCategory === item.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(item.id)}
          >
            <Feather
              name={item.icon}
              size={16}
              color={
                selectedCategory === item.id
                  ? colors.text.inverse
                  : colors.text.secondary
              }
            />
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === item.id && styles.categoryChipTextActive,
              ]}
            >
              {item.name}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );

  const renderInvestmentCard = ({
    item,
    index,
  }: {
    item: Investment;
    index: number;
  }) => {
    const progress = (item.fundingCurrent / item.fundingGoal) * 100;

    return (
      <Animated.View
        entering={FadeInDown.duration(400).delay(index * 100)}
        layout={Layout.springify()}
      >
        <Pressable
          style={styles.investmentCard}
          onPress={() => handleInvestmentPress(item)}
        >
          <LinearGradient
            colors={['#0066CC', '#00A86B'] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{item.category}</Text>
              </View>
              <View
                style={[
                  styles.riskBadge,
                  item.riskLevel === 'High' && styles.riskBadgeHigh,
                  item.riskLevel === 'Low' && styles.riskBadgeLow,
                ]}
              >
                <Text style={styles.riskBadgeText}>{item.riskLevel} Risk</Text>
              </View>
            </View>

            {/* Card Content */}
            <View style={styles.cardContent}>
              <Text style={styles.investmentName}>{item.name}</Text>
              <Text style={styles.investmentDescription} numberOfLines={2}>
                {item.description}
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${progress}%` }]}
                />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressText}>
                  ${(item.fundingCurrent / 1000000).toFixed(1)}M raised
                </Text>
                <Text style={styles.progressText}>
                  {progress.toFixed(0)}% funded
                </Text>
              </View>
            </View>

            {/* Card Footer */}
            <View style={styles.cardFooter}>
              <View style={styles.metric}>
                <Feather
                  name="trending-up"
                  size={14}
                  color={colors.text.inverse}
                />
                <Text style={styles.metricText}>{item.expectedROI} ROI</Text>
              </View>
              <View style={styles.metric}>
                <Feather name="clock" size={14} color={colors.text.inverse} />
                <Text style={styles.metricText}>
                  {item.daysRemaining} days left
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Feather name="search" size={48} color={colors.text.tertiary} />
      </View>
      <Text style={styles.emptyTitle}>No investments found</Text>
      <Text style={styles.emptyDescription}>
        Try adjusting your search or filters to find investment opportunities.
      </Text>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.screenTitle}>Discover</Text>
      </View>

      {/* Content */}
      <FlatList
        data={filteredInvestments}
        keyExtractor={(item) => item.id}
        renderItem={renderInvestmentCard}
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

  // Header Content (Search + Categories)
  headerContent: {
    paddingBottom: spacing.lg,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    borderRadius: layout.radiusLarge,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    height: layout.inputHeight,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
  },
  filterButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },

  // Categories
  categoriesContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface.primary,
    borderRadius: layout.radiusFull,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  categoryChipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  categoryChipText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  categoryChipTextActive: {
    color: colors.text.inverse,
  },

  // List
  listContent: {
    paddingTop: spacing.md,
  },

  // Investment Card
  investmentCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: layout.radiusLarge,
    overflow: 'hidden',
    ...shadows.elevated,
  },
  cardGradient: {
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  categoryBadge: {
    backgroundColor: colors.transparent.white20,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: layout.radiusSmall,
  },
  categoryBadgeText: {
    ...typography.small,
    color: colors.text.inverse,
  },
  riskBadge: {
    backgroundColor: colors.transparent.white20,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: layout.radiusSmall,
  },
  riskBadgeHigh: {
    backgroundColor: 'rgba(220, 38, 38, 0.3)',
  },
  riskBadgeLow: {
    backgroundColor: 'rgba(0, 168, 107, 0.3)',
  },
  riskBadgeText: {
    ...typography.small,
    color: colors.text.inverse,
  },
  cardContent: {
    marginBottom: spacing.lg,
  },
  investmentName: {
    ...typography.heading,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
  },
  investmentDescription: {
    ...typography.caption,
    color: colors.transparent.white50,
    lineHeight: 20,
  },

  // Progress
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressBar: {
    height: layout.progressBarHeight,
    backgroundColor: colors.transparent.white20,
    borderRadius: layout.progressBarHeight / 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.text.inverse,
    borderRadius: layout.progressBarHeight / 2,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  progressText: {
    ...typography.small,
    color: colors.transparent.white50,
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metricText: {
    ...typography.captionMedium,
    color: colors.text.inverse,
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
