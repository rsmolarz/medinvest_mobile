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
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors, typography, spacing, layout } from '@/theme';
import {
  Badge,
  Card,
  EmptyState,
  SkeletonListItem,
} from '@/components';
import { useTransactions } from '@/api';
import { useInfiniteList } from '@/hooks';
import type { Transaction } from '@/types';

type TransactionFilter = 'all' | 'investment' | 'dividend' | 'withdrawal';

const FILTERS: { key: TransactionFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'investment', label: 'Investments' },
  { key: 'dividend', label: 'Dividends' },
  { key: 'withdrawal', label: 'Withdrawals' },
];

interface TransactionHistoryScreenProps {
  navigation: any;
}

export default function TransactionHistoryScreen({
  navigation,
}: TransactionHistoryScreenProps) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<TransactionFilter>('all');

  const transactionsQuery = useTransactions(
    filter === 'all' ? undefined : filter
  );

  const {
    data: transactions,
    isLoading,
    refreshing,
    onRefresh,
    onEndReached,
    isFetchingNextPage,
    isEmpty,
  } = useInfiniteList(transactionsQuery);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string): keyof typeof Feather.glyphMap => {
    switch (type) {
      case 'investment':
        return 'trending-up';
      case 'dividend':
        return 'dollar-sign';
      case 'withdrawal':
        return 'arrow-down-circle';
      case 'refund':
        return 'rotate-ccw';
      default:
        return 'activity';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'investment':
        return colors.primary.main;
      case 'dividend':
        return colors.semantic.success;
      case 'withdrawal':
        return colors.semantic.warning;
      case 'refund':
        return colors.text.secondary;
      default:
        return colors.text.primary;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" size="sm">Completed</Badge>;
      case 'pending':
        return <Badge variant="warning" size="sm">Pending</Badge>;
      case 'failed':
        return <Badge variant="error" size="sm">Failed</Badge>;
      default:
        return null;
    }
  };

  const renderTransaction = useCallback(
    ({ item, index }: { item: Transaction; index: number }) => {
      const icon = getTransactionIcon(item.type);
      const iconColor = getTransactionColor(item.type);
      const isPositive = item.type === 'dividend' || item.type === 'refund';

      return (
        <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
          <Card
            variant="flat"
            padding="md"
            style={styles.transactionCard}
          >
            <View style={styles.transactionRow}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${iconColor}15` },
                ]}
              >
                <Feather name={icon} size={20} color={iconColor} />
              </View>

              <View style={styles.transactionDetails}>
                <View style={styles.transactionHeader}>
                  <Text style={styles.transactionType}>
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                  </Text>
                  {getStatusBadge(item.status)}
                </View>
                
                {item.investmentName ? (
                  <Text style={styles.investmentName} numberOfLines={1}>
                    {item.investmentName}
                  </Text>
                ) : null}
                
                <Text style={styles.transactionDate}>
                  {formatDate(item.createdAt)} at {formatTime(item.createdAt)}
                </Text>
              </View>

              <Text
                style={[
                  styles.amount,
                  isPositive ? styles.amountPositive : styles.amountNegative,
                ]}
              >
                {isPositive ? '+' : '-'}${item.amount.toLocaleString()}
              </Text>
            </View>
          </Card>
        </Animated.View>
      );
    },
    []
  );

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: 6 }).map((_, index) => (
        <SkeletonListItem
          key={index}
          hasAvatar
          avatarSize={44}
          lines={2}
          hasRightElement
          style={styles.skeletonItem}
        />
      ))}
    </View>
  );

  const renderEmpty = () => (
    <EmptyState
      icon="activity"
      title="No transactions yet"
      description="Your investment transactions will appear here once you start investing."
      primaryAction={{
        label: 'Explore Investments',
        onPress: () => navigation.navigate('Discover'),
      }}
    />
  );

  const renderHeader = () => (
    <View style={styles.filtersContainer}>
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersList}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setFilter(item.key)}
            style={[
              styles.filterChip,
              filter === item.key ? styles.filterChipActive : null,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === item.key ? styles.filterChipTextActive : null,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    
    return (
      <View style={styles.footerLoader}>
        <SkeletonListItem hasAvatar avatarSize={44} lines={2} hasRightElement />
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton} hitSlop={8}>
          <Feather name="arrow-left" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <View style={styles.headerSpacer} />
      </View>

      {renderHeader()}

      {isLoading ? (
        renderSkeleton()
      ) : isEmpty ? (
        renderEmpty()
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransaction}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + spacing.lg },
          ]}
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary.main}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.heading,
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },

  filtersContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  filtersList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: layout.radiusFull,
    backgroundColor: colors.background.secondary,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary.main,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.text.inverse,
  },

  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },

  transactionCard: {
    marginBottom: spacing.xs,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  transactionDetails: {
    flex: 1,
    marginRight: spacing.sm,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs / 2,
  },
  transactionType: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  investmentName: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs / 2,
  },
  transactionDate: {
    ...typography.small,
    color: colors.text.tertiary,
  },
  amount: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
  amountPositive: {
    color: colors.semantic.success,
  },
  amountNegative: {
    color: colors.text.primary,
  },

  skeletonContainer: {
    padding: spacing.md,
  },
  skeletonItem: {
    marginBottom: spacing.sm,
  },

  footerLoader: {
    paddingVertical: spacing.md,
  },
});
