/**
 * BlockedUsers Screen
 * View and manage blocked users
 */

import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { usersApi } from '@/lib/api';
import { User } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

interface BlockedUser {
  user: User;
  blocked_at: string;
}

export default function BlockedUsersScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  // Fetch blocked users
  const {
    data: blockedUsers,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['blockedUsers'],
    queryFn: async () => {
      const response = await usersApi.getBlockedUsers();
      return response.data?.users || [];
    },
  });

  // Unblock mutation
  const unblockMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await usersApi.unblock(userId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to unblock user');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blockedUsers'] });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleUnblock = useCallback((user: User) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${user.full_name}? They will be able to see your profile and interact with your content again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: () => unblockMutation.mutate(user.id),
        },
      ]
    );
  }, [unblockMutation]);

  const renderUser = ({ item }: { item: BlockedUser }) => (
    <View style={styles.userCard}>
      <TouchableOpacity
        style={styles.userInfo}
        onPress={() => navigation.navigate('UserProfile', { userId: item.user.id })}
      >
        {item.user.avatar_url ? (
          <Image source={{ uri: item.user.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <ThemedText style={styles.avatarText}>
              {item.user.first_name?.[0]}{item.user.last_name?.[0]}
            </ThemedText>
          </View>
        )}
        <View style={styles.userDetails}>
          <ThemedText style={styles.userName}>{item.user.full_name}</ThemedText>
          {item.user.specialty && (
            <ThemedText style={styles.userSpecialty}>{item.user.specialty}</ThemedText>
          )}
          <ThemedText style={styles.blockedDate}>
            Blocked {formatRelativeTime(item.blocked_at)}
          </ThemedText>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.unblockButton}
        onPress={() => handleUnblock(item.user)}
        disabled={unblockMutation.isPending}
      >
        {unblockMutation.isPending ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <ThemedText style={styles.unblockButtonText}>Unblock</ThemedText>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="person-remove-outline" size={48} color={Colors.textSecondary} />
      </View>
      <ThemedText style={styles.emptyTitle}>No Blocked Users</ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        When you block someone, they'll appear here. Blocked users can't see your profile or interact with your content.
      </ThemedText>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.infoCard}>
      <Ionicons name="information-circle-outline" size={20} color={Colors.textSecondary} />
      <ThemedText style={styles.infoText}>
        Blocked users cannot view your profile, see your posts, or send you messages. They won't be notified when you block or unblock them.
      </ThemedText>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Blocked Users</ThemedText>
        <View style={styles.backButton} />
      </View>

      {/* Content */}
      <FlatList
        data={blockedUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.user.id.toString()}
        ListHeaderComponent={blockedUsers && blockedUsers.length > 0 ? renderHeader : null}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          (!blockedUsers || blockedUsers.length === 0) && styles.listContentEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.heading,
    color: Colors.textPrimary,
  },
  listContent: {
    padding: Spacing.md,
  },
  listContentEmpty: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.light.backgroundSecondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  infoText: {
    ...Typography.small,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: Spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  userSpecialty: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  blockedDate: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  unblockButton: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    minWidth: 80,
    alignItems: 'center',
  },
  unblockButtonText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.heading,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
