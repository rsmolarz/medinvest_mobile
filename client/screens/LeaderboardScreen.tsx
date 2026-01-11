/**
 * Leaderboard Screen
 * Points leaderboard rankings
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { gamificationApi } from '@/lib/api';
import { LeaderboardEntry } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { formatNumber } from '@/lib/utils';

type Period = 'weekly' | 'monthly' | 'all_time';

export default function LeaderboardScreen() {
  const navigation = useNavigation<any>();
  const { user: currentUser } = useAuth();
  const [period, setPeriod] = useState<Period>('weekly');

  const {
    data: leaderboard,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: async () => {
      const response = await gamificationApi.getLeaderboard(period);
      return response.data?.leaderboard || [];
    },
  });

  const { data: myStats } = useQuery({
    queryKey: ['myStats'],
    queryFn: async () => {
      const response = await gamificationApi.getMyStats();
      return response.data;
    },
  });

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return Colors.textSecondary;
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return <MaterialCommunityIcons name="trophy" size={24} color={getRankColor(rank)} />;
    }
    return <ThemedText style={styles.rankNumber}>{rank}</ThemedText>;
  };

  const renderTopThree = () => {
    if (!leaderboard || leaderboard.length < 3) return null;

    const top3 = leaderboard.slice(0, 3);
    const [first, second, third] = top3;

    return (
      <View style={styles.topThreeContainer}>
        {/* Second Place */}
        <View style={styles.topThreeItem}>
          <View style={[styles.topThreeAvatar, styles.secondPlace]}>
            {second.user.avatar_url ? (
              <Image source={{ uri: second.user.avatar_url }} style={styles.topThreeImage} />
            ) : (
              <ThemedText style={styles.topThreeInitials}>
                {second.user.first_name[0]}{second.user.last_name[0]}
              </ThemedText>
            )}
            <View style={[styles.topThreeBadge, { backgroundColor: '#C0C0C0' }]}>
              <ThemedText style={styles.topThreeBadgeText}>2</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.topThreeName} numberOfLines={1}>
            {second.user.first_name}
          </ThemedText>
          <ThemedText style={styles.topThreePoints}>{formatNumber(second.points)}</ThemedText>
        </View>

        {/* First Place */}
        <View style={styles.topThreeItem}>
          <View style={[styles.topThreeAvatar, styles.firstPlace]}>
            {first.user.avatar_url ? (
              <Image source={{ uri: first.user.avatar_url }} style={styles.topThreeImage} />
            ) : (
              <ThemedText style={styles.topThreeInitials}>
                {first.user.first_name[0]}{first.user.last_name[0]}
              </ThemedText>
            )}
            <View style={[styles.topThreeBadge, { backgroundColor: '#FFD700' }]}>
              <MaterialCommunityIcons name="crown" size={14} color="white" />
            </View>
          </View>
          <ThemedText style={styles.topThreeName} numberOfLines={1}>
            {first.user.first_name}
          </ThemedText>
          <ThemedText style={styles.topThreePoints}>{formatNumber(first.points)}</ThemedText>
        </View>

        {/* Third Place */}
        <View style={styles.topThreeItem}>
          <View style={[styles.topThreeAvatar, styles.thirdPlace]}>
            {third.user.avatar_url ? (
              <Image source={{ uri: third.user.avatar_url }} style={styles.topThreeImage} />
            ) : (
              <ThemedText style={styles.topThreeInitials}>
                {third.user.first_name[0]}{third.user.last_name[0]}
              </ThemedText>
            )}
            <View style={[styles.topThreeBadge, { backgroundColor: '#CD7F32' }]}>
              <ThemedText style={styles.topThreeBadgeText}>3</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.topThreeName} numberOfLines={1}>
            {third.user.first_name}
          </ThemedText>
          <ThemedText style={styles.topThreePoints}>{formatNumber(third.points)}</ThemedText>
        </View>
      </View>
    );
  };

  const renderEntry = ({ item }: { item: LeaderboardEntry }) => {
    const isCurrentUser = item.user.id === currentUser?.id;

    return (
      <TouchableOpacity
        style={[styles.entryItem, isCurrentUser && styles.entryItemCurrent]}
        onPress={() => navigation.navigate('UserProfile', { userId: item.user.id })}
      >
        <View style={styles.entryRank}>{getRankIcon(item.rank)}</View>
        {item.user.avatar_url ? (
          <Image source={{ uri: item.user.avatar_url }} style={styles.entryAvatar} />
        ) : (
          <View style={[styles.entryAvatar, styles.entryAvatarPlaceholder]}>
            <ThemedText style={styles.entryAvatarText}>
              {item.user.first_name[0]}{item.user.last_name[0]}
            </ThemedText>
          </View>
        )}
        <View style={styles.entryInfo}>
          <ThemedText style={styles.entryName}>{item.user.full_name}</ThemedText>
          <ThemedText style={styles.entryLevel}>Level {item.user.level}</ThemedText>
        </View>
        <View style={styles.entryPoints}>
          <ThemedText style={styles.entryPointsValue}>{formatNumber(item.points)}</ThemedText>
          <ThemedText style={styles.entryPointsLabel}>pts</ThemedText>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View>
      {/* Period Selector */}
      <View style={styles.periodContainer}>
        {(['weekly', 'monthly', 'all_time'] as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodButton, period === p && styles.periodButtonActive]}
            onPress={() => setPeriod(p)}
          >
            <ThemedText style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p === 'all_time' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Top 3 */}
      {renderTopThree()}

      {/* Your Stats */}
      {myStats && (
        <View style={styles.myStatsContainer}>
          <ThemedText style={styles.myStatsTitle}>Your Stats</ThemedText>
          <View style={styles.myStatsRow}>
            <View style={styles.myStatItem}>
              <ThemedText style={styles.myStatValue}>#{myStats.rank}</ThemedText>
              <ThemedText style={styles.myStatLabel}>Rank</ThemedText>
            </View>
            <View style={styles.myStatItem}>
              <ThemedText style={styles.myStatValue}>{formatNumber(myStats.points)}</ThemedText>
              <ThemedText style={styles.myStatLabel}>Points</ThemedText>
            </View>
            <View style={styles.myStatItem}>
              <ThemedText style={styles.myStatValue}>{myStats.streak}</ThemedText>
              <ThemedText style={styles.myStatLabel}>Streak</ThemedText>
            </View>
          </View>
        </View>
      )}

      {/* Rankings Header */}
      <View style={styles.rankingsHeader}>
        <ThemedText style={styles.rankingsTitle}>Rankings</ThemedText>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Leaderboard</ThemedText>
        <View style={styles.backButton} />
      </View>

      {/* Leaderboard List */}
      <FlatList
        data={leaderboard?.slice(3)}
        renderItem={renderEntry}
        keyExtractor={(item) => item.user.id.toString()}
        ListHeaderComponent={renderHeader}
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.heading,
    color: Colors.textPrimary,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  periodContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
  },
  periodText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  periodTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  topThreeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
  },
  topThreeItem: {
    alignItems: 'center',
    marginHorizontal: Spacing.md,
  },
  topThreeAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 3,
  },
  firstPlace: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderColor: '#FFD700',
    marginBottom: Spacing.md,
  },
  secondPlace: {
    borderColor: '#C0C0C0',
  },
  thirdPlace: {
    borderColor: '#CD7F32',
  },
  topThreeImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  topThreeInitials: {
    ...Typography.heading,
    color: Colors.primary,
  },
  topThreeBadge: {
    position: 'absolute',
    bottom: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  topThreeBadgeText: {
    ...Typography.small,
    color: 'white',
    fontWeight: '700',
  },
  topThreeName: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  topThreePoints: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  myStatsContainer: {
    margin: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.md,
  },
  myStatsTitle: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  myStatsRow: {
    flexDirection: 'row',
  },
  myStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  myStatValue: {
    ...Typography.heading,
    color: Colors.textPrimary,
  },
  myStatLabel: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  rankingsHeader: {
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  rankingsTitle: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  entryItemCurrent: {
    backgroundColor: Colors.primary + '08',
  },
  entryRank: {
    width: 32,
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  rankNumber: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  entryAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: Spacing.md,
  },
  entryAvatarPlaceholder: {
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryAvatarText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  entryInfo: {
    flex: 1,
  },
  entryName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  entryLevel: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  entryPoints: {
    alignItems: 'flex-end',
  },
  entryPointsValue: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.primary,
  },
  entryPointsLabel: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
});
