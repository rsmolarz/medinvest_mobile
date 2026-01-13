/**
 * Deals Screen
 * Browse and invest in healthcare deals
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { dealsApi, Deal } from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/utils';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all', name: 'All', icon: '🌐' },
  { id: 'biotech', name: 'Biotech', icon: '🧬' },
  { id: 'medtech', name: 'MedTech', icon: '🏥' },
  { id: 'pharma', name: 'Pharma', icon: '💊' },
  { id: 'digital-health', name: 'Digital Health', icon: '📱' },
  { id: 'diagnostics', name: 'Diagnostics', icon: '🔬' },
];

export default function DealsScreen() {
  const navigation = useNavigation<any>();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const {
    data: dealsData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['/api/deals', selectedCategory],
    queryFn: async () => {
      const response = await dealsApi.getDeals(
        selectedCategory === 'all' ? undefined : selectedCategory
      );
      return response.data;
    },
  });

  const deals = dealsData?.deals || [];

  const handleDealPress = useCallback((dealId: number) => {
    navigation.navigate('DealDetail', { dealId });
  }, [navigation]);

  const renderCategoryFilter = () => (
    <FlatList
      horizontal
      data={CATEGORIES}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoriesContainer}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.categoryChip,
            selectedCategory === item.id && styles.categoryChipActive,
          ]}
          onPress={() => setSelectedCategory(item.id)}
        >
          <ThemedText style={styles.categoryIcon}>{item.icon}</ThemedText>
          <ThemedText
            style={[
              styles.categoryName,
              selectedCategory === item.id && styles.categoryNameActive,
            ]}
          >
            {item.name}
          </ThemedText>
        </TouchableOpacity>
      )}
      keyExtractor={(item) => item.id}
    />
  );

  const renderDealCard = ({ item }: { item: Deal }) => {
    const fundingProgress = (item.raised / item.target_raise) * 100;
    const daysLeft = Math.ceil(
      (new Date(item.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return (
      <TouchableOpacity
        style={styles.dealCard}
        onPress={() => handleDealPress(item.id)}
      >
        {/* Header */}
        <View style={styles.dealHeader}>
          {item.company_logo ? (
            <Image source={{ uri: item.company_logo }} style={styles.companyLogo} />
          ) : (
            <View style={[styles.companyLogo, styles.companyLogoPlaceholder]}>
              <ThemedText style={styles.companyLogoText}>
                {item.company_name.charAt(0)}
              </ThemedText>
            </View>
          )}
          <View style={styles.dealInfo}>
            <ThemedText style={styles.companyName}>{item.company_name}</ThemedText>
            <ThemedText style={styles.dealTitle} numberOfLines={1}>
              {item.title}
            </ThemedText>
          </View>
          <View style={[
            styles.statusBadge,
            item.status === 'active' ? styles.statusActive : styles.statusClosed,
          ]}>
            <ThemedText style={styles.statusText}>
              {item.status === 'active' ? 'Active' : 'Closed'}
            </ThemedText>
          </View>
        </View>

        {/* Description */}
        <ThemedText style={styles.dealDescription} numberOfLines={2}>
          {item.description}
        </ThemedText>

        {/* Highlights */}
        {item.highlights && item.highlights.length > 0 && (
          <View style={styles.highlights}>
            {item.highlights.slice(0, 2).map((highlight, index) => (
              <View key={index} style={styles.highlightItem}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.secondary} />
                <ThemedText style={styles.highlightText} numberOfLines={1}>
                  {highlight}
                </ThemedText>
              </View>
            ))}
          </View>
        )}

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${Math.min(fundingProgress, 100)}%` }]}
            />
          </View>
          <View style={styles.progressStats}>
            <ThemedText style={styles.progressAmount}>
              {formatCurrency(item.raised)} raised
            </ThemedText>
            <ThemedText style={styles.progressPercent}>
              {fundingProgress.toFixed(0)}%
            </ThemedText>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.dealFooter}>
          <View style={styles.footerItem}>
            <Ionicons name="flag-outline" size={16} color={Colors.textSecondary} />
            <ThemedText style={styles.footerText}>
              {formatCurrency(item.target_raise)} goal
            </ThemedText>
          </View>
          <View style={styles.footerItem}>
            <Ionicons name="cash-outline" size={16} color={Colors.textSecondary} />
            <ThemedText style={styles.footerText}>
              {formatCurrency(item.minimum_investment)} min
            </ThemedText>
          </View>
          <View style={styles.footerItem}>
            <Ionicons name="people-outline" size={16} color={Colors.textSecondary} />
            <ThemedText style={styles.footerText}>
              {formatNumber(item.investors_count)}
            </ThemedText>
          </View>
          <View style={styles.footerItem}>
            <Ionicons name="time-outline" size={16} color={daysLeft <= 7 ? Colors.error : Colors.textSecondary} />
            <ThemedText style={[styles.footerText, daysLeft <= 7 && styles.urgentText]}>
              {daysLeft > 0 ? `${daysLeft}d left` : 'Ended'}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="chart-line" size={64} color={Colors.textSecondary} />
      <ThemedText style={styles.emptyTitle}>No deals available</ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        Check back later for new investment opportunities
      </ThemedText>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <ThemedText style={styles.statValue}>{deals?.length || 0}</ThemedText>
          <ThemedText style={styles.statLabel}>Active Deals</ThemedText>
        </View>
        <View style={styles.statCard}>
          <ThemedText style={styles.statValue}>
            {formatCurrency(
              deals?.reduce((sum, d) => sum + (d.raised || 0), 0) || 0
            )}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Total Raised</ThemedText>
        </View>
      </View>
      {renderCategoryFilter()}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>Investment Deals</ThemedText>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Deals List */}
      <FlatList
        data={deals}
        renderItem={renderDealCard}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    ...Typography.title,
    color: Colors.textPrimary,
  },
  filterButton: {
    padding: Spacing.sm,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  headerSection: {
    backgroundColor: Colors.surface,
    paddingBottom: Spacing.md,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.heading,
    color: Colors.primary,
    fontWeight: '700',
  },
  statLabel: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  categoriesContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.backgroundSecondary,
    marginRight: Spacing.sm,
    gap: Spacing.xs,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary + '15',
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryName: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  categoryNameActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  dealCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  dealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  companyLogo: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  companyLogoPlaceholder: {
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyLogoText: {
    ...Typography.heading,
    color: Colors.primary,
  },
  dealInfo: {
    flex: 1,
  },
  companyName: {
    ...Typography.small,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dealTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusActive: {
    backgroundColor: Colors.secondary + '20',
  },
  statusClosed: {
    backgroundColor: Colors.textSecondary + '20',
  },
  statusText: {
    ...Typography.small,
    fontWeight: '600',
  },
  dealDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  highlights: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  highlightText: {
    ...Typography.small,
    color: Colors.textPrimary,
    flex: 1,
  },
  progressContainer: {
    marginTop: Spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  progressAmount: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  progressPercent: {
    ...Typography.caption,
    color: Colors.secondary,
    fontWeight: '600',
  },
  dealFooter: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  footerText: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  urgentText: {
    color: Colors.error,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['5xl'],
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.heading,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
