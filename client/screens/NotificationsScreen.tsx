/**
 * Notifications Screen
 * Shows all user notifications with filtering
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { notificationsApi } from '@/lib/api';
import { Notification, NotificationType } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

const NOTIFICATION_ICONS: Record<NotificationType, { name: string; color: string }> = {
  like: { name: 'heart', color: '#EF4444' },
  comment: { name: 'chatbubble', color: '#3B82F6' },
  follow: { name: 'person-add', color: '#8B5CF6' },
  mention: { name: 'at', color: '#10B981' },
  reply: { name: 'arrow-undo', color: '#F59E0B' },
  message: { name: 'mail', color: '#06B6D4' },
  ama_live: { name: 'mic', color: '#EC4899' },
  deal_update: { name: 'trending-up', color: '#22C55E' },
  achievement: { name: 'trophy', color: '#F97316' },
  friend_request: { name: 'people', color: '#8B5CF6' },
  friend_accepted: { name: 'checkmark-circle', color: '#22C55E' },
  investment_update: { name: 'cash', color: '#00A86B' },
  course_update: { name: 'school', color: '#3B82F6' },
  event_reminder: { name: 'calendar', color: '#F59E0B' },
  system: { name: 'information-circle', color: '#6B7280' },
};

type FilterType = 'all' | 'unread' | 'mentions';

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterType>('all');
  const appColors = useAppColors();

  const {
    data: notificationsData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await notificationsApi.getNotifications();
      return response.data;
    },
  });

  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unread_count || 0;

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'mentions') return n.type === 'mention';
    return true;
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationPress = useCallback((notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate based on type
    const { data } = notification;
    switch (notification.type) {
      case 'like':
      case 'comment':
      case 'mention':
      case 'reply':
        if (data?.post_id) {
          navigation.navigate('PostDetail', { postId: data.post_id });
        }
        break;
      case 'follow':
        if (data?.user_id) {
          navigation.navigate('UserProfile', { userId: data.user_id });
        }
        break;
      case 'message':
        if (data?.user_id) {
          navigation.navigate('Conversation', { userId: data.user_id });
        }
        break;
      case 'ama_live':
        if (data?.ama_id) {
          navigation.navigate('AMADetail', { amaId: data.ama_id });
        }
        break;
      case 'deal_update':
        if (data?.deal_id) {
          navigation.navigate('DealDetail', { dealId: data.deal_id });
        }
        break;
      case 'achievement':
        navigation.navigate('Achievements');
        break;
      case 'friend_request':
      case 'friend_accepted':
        if (data?.user_id) {
          navigation.navigate('UserProfile', { userId: data.user_id });
        }
        break;
      case 'investment_update':
        if (data?.deal_id) {
          navigation.navigate('DealDetail', { dealId: data.deal_id });
        } else {
          navigation.getParent()?.navigate('PortfolioTab');
        }
        break;
      case 'course_update':
        if (data?.course_id) {
          navigation.navigate('CourseDetail', { courseId: data.course_id });
        }
        break;
      case 'event_reminder':
        if (data?.event_id) {
          navigation.navigate('EventDetail', { eventId: data.event_id });
        }
        break;
      case 'system':
        break;
    }
  }, [navigation, markAsReadMutation]);

  const getNotificationIcon = (type: NotificationType) => {
    const config = NOTIFICATION_ICONS[type] || { name: 'notifications', color: Colors.primary };
    return (
      <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
        <Ionicons name={config.name as any} size={20} color={config.color} />
      </View>
    );
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, { backgroundColor: appColors.surface, borderBottomColor: appColors.border }, !item.is_read && styles.notificationUnread]}
      onPress={() => handleNotificationPress(item)}
    >
      {getNotificationIcon(item.type)}
      <View style={styles.notificationContent}>
        <ThemedText style={[styles.notificationTitle, { color: appColors.textPrimary }]} numberOfLines={2}>
          {item.title}
        </ThemedText>
        <ThemedText style={[styles.notificationBody, { color: appColors.textSecondary }]} numberOfLines={2}>
          {item.body}
        </ThemedText>
        <ThemedText style={[styles.notificationTime, { color: appColors.textSecondary }]}>
          {formatRelativeTime(item.created_at)}
        </ThemedText>
      </View>
      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={[styles.filterContainer, { backgroundColor: appColors.surface }]}>
      {(['all', 'unread', 'mentions'] as FilterType[]).map((f) => (
        <TouchableOpacity
          key={f}
          style={[styles.filterButton, filter === f && styles.filterButtonActive]}
          onPress={() => setFilter(f)}
        >
          <ThemedText style={[styles.filterText, { color: appColors.textSecondary }, filter === f && styles.filterTextActive]}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color={appColors.textSecondary} />
      <ThemedText style={[styles.emptyTitle, { color: appColors.textPrimary }]}>No notifications</ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: appColors.textSecondary }]}>
        {filter === 'unread' 
          ? "You're all caught up!"
          : filter === 'mentions'
          ? "No one has mentioned you yet"
          : "When you get notifications, they'll appear here"}
      </ThemedText>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: appColors.surface, borderBottomColor: appColors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={appColors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: appColors.textPrimary }]}>Notifications</ThemedText>
        {unreadCount > 0 && (
          <TouchableOpacity 
            style={styles.markAllButton}
            onPress={() => markAllAsReadMutation.mutate()}
          >
            <ThemedText style={styles.markAllText}>Mark all read</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
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
        contentContainerStyle={filteredNotifications.length === 0 ? styles.emptyList : undefined}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  headerTitle: {
    ...Typography.title,
    flex: 1,
  },
  markAllButton: {
    padding: Spacing.sm,
  },
  markAllText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary + '15',
  },
  filterText: {
    ...Typography.caption,
  },
  filterTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  notificationUnread: {
    backgroundColor: Colors.primary + '05',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    ...Typography.body,
    fontWeight: '600',
  },
  notificationBody: {
    ...Typography.caption,
    marginTop: 2,
  },
  notificationTime: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: Spacing.sm,
    marginTop: Spacing.xs,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['5xl'],
  },
  emptyTitle: {
    ...Typography.heading,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
