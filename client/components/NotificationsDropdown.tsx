/**
 * Notifications Dropdown Component
 * Grouped notifications with rich content display
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { notificationsApi, Notification } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NotificationsDropdownProps {
  visible: boolean;
  onClose: () => void;
  anchorPosition?: { top: number; right: number };
}

// Group notifications by time period
type NotificationGroup = {
  title: string;
  items: Notification[];
};

function groupNotifications(notifications: Notification[]): NotificationGroup[] {
  const now = new Date();
  const thisWeek: Notification[] = [];
  const earlier: Notification[] = [];

  notifications.forEach(notification => {
    const notifDate = new Date(notification.created_at);
    const diffDays = Math.floor((now.getTime() - notifDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      thisWeek.push(notification);
    } else {
      earlier.push(notification);
    }
  });

  const groups: NotificationGroup[] = [];
  if (thisWeek.length > 0) {
    groups.push({ title: 'THIS WEEK', items: thisWeek });
  }
  if (earlier.length > 0) {
    groups.push({ title: 'EARLIER', items: earlier });
  }

  return groups;
}

export default function NotificationsDropdown({
  visible,
  onClose,
  anchorPosition = { top: 60, right: 16 },
}: NotificationsDropdownProps) {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'dropdown'],
    queryFn: async () => {
      const response = await notificationsApi.getNotifications(1);
      return {
        notifications: response.data?.notifications || [],
        unread_count: response.data?.unread_count || 0,
      };
    },
    enabled: visible,
  });

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await notificationsApi.markAsRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationPress = useCallback((notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      markReadMutation.mutate(notification.id);
    }

    // Navigate based on notification type
    const data = notification.data as any;
    
    switch (notification.type) {
      case 'publication_match':
        if (data?.publication_id) {
          navigation.navigate('PostDetail', { postId: data.publication_id });
        }
        break;
      case 'peer_update':
        if (data?.user_id) {
          navigation.navigate('UserProfile', { userId: data.user_id });
        }
        break;
      case 'highlight':
      case 'mention':
        if (data?.post_id) {
          navigation.navigate('PostDetail', { postId: data.post_id });
        }
        break;
      case 'follow':
        if (data?.follower_id) {
          navigation.navigate('UserProfile', { userId: data.follower_id });
        }
        break;
      default:
        navigation.navigate('Notifications');
    }

    onClose();
  }, [navigation, markReadMutation, onClose]);

  const handleViewAll = useCallback(() => {
    navigation.navigate('Notifications');
    onClose();
  }, [navigation, onClose]);

  const handleSettings = useCallback(() => {
    navigation.navigate('Settings', { section: 'notifications' });
    onClose();
  }, [navigation, onClose]);

  const groups = data?.notifications ? groupNotifications(data.notifications) : [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable 
          style={[styles.dropdown, { top: anchorPosition.top, right: anchorPosition.right }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="notifications" size={20} color={Colors.textPrimary} />
              <ThemedText style={styles.headerTitle}>Notifications</ThemedText>
            </View>
            <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
              <Ionicons name="settings-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : groups.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={32} color={Colors.textSecondary} />
                <ThemedText style={styles.emptyText}>No notifications yet</ThemedText>
              </View>
            ) : (
              groups.map((group, groupIndex) => (
                <View key={groupIndex} style={styles.group}>
                  <ThemedText style={styles.groupTitle}>{group.title}</ThemedText>
                  {group.items.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onPress={() => handleNotificationPress(notification)}
                    />
                  ))}
                </View>
              ))
            )}
          </ScrollView>

          {/* Footer */}
          <TouchableOpacity style={styles.footer} onPress={handleViewAll}>
            <ThemedText style={styles.footerText}>View all notifications</ThemedText>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Individual notification item
interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
}

function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'publication_match':
        return { icon: 'document-text', color: Colors.primary, bg: Colors.primary + '20' };
      case 'peer_update':
        return { icon: 'people', color: Colors.secondary, bg: Colors.secondary + '20' };
      case 'highlight':
        return { icon: 'star', color: Colors.warning, bg: Colors.warning + '20' };
      case 'mention':
        return { icon: 'at', color: Colors.primary, bg: Colors.primary + '20' };
      case 'follow':
        return { icon: 'person-add', color: Colors.secondary, bg: Colors.secondary + '20' };
      case 'like':
        return { icon: 'heart', color: Colors.error, bg: Colors.error + '20' };
      case 'comment':
        return { icon: 'chatbubble', color: Colors.primary, bg: Colors.primary + '20' };
      default:
        return { icon: 'notifications', color: Colors.textSecondary, bg: Colors.light.backgroundSecondary };
    }
  };

  const iconConfig = getNotificationIcon();
  const data = notification.data as any;

  return (
    <TouchableOpacity
      style={[styles.notificationItem, !notification.is_read && styles.unreadItem]}
      onPress={onPress}
    >
      {/* Icon */}
      <View style={[styles.notificationIcon, { backgroundColor: iconConfig.bg }]}>
        <Ionicons name={iconConfig.icon as any} size={18} color={iconConfig.color} />
      </View>

      {/* Content */}
      <View style={styles.notificationContent}>
        <ThemedText style={styles.notificationTitle} numberOfLines={2}>
          {notification.title}
        </ThemedText>
        {notification.body && (
          <ThemedText style={styles.notificationBody} numberOfLines={2}>
            {notification.body}
          </ThemedText>
        )}
        <ThemedText style={styles.notificationTime}>
          {formatRelativeTime(notification.created_at)}
        </ThemedText>
      </View>

      {/* More button */}
      <TouchableOpacity style={styles.moreButton}>
        <Ionicons name="ellipsis-horizontal" size={16} color={Colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// Notification bell with badge
interface NotificationBellProps {
  onPress: () => void;
  unreadCount?: number;
}

export function NotificationBell({ onPress, unreadCount = 0 }: NotificationBellProps) {
  return (
    <TouchableOpacity style={styles.bellContainer} onPress={onPress}>
      <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  dropdown: {
    position: 'absolute',
    width: Math.min(SCREEN_WIDTH - 32, 380),
    maxHeight: 480,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadows.card,
    shadowOpacity: 0.2,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  settingsButton: {
    padding: Spacing.xs,
  },
  content: {
    maxHeight: 360,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  group: {
    paddingTop: Spacing.sm,
  },
  groupTitle: {
    ...Typography.small,
    fontWeight: '600',
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  unreadItem: {
    backgroundColor: Colors.primary + '08',
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  notificationBody: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  notificationTime: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  moreButton: {
    padding: Spacing.xs,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },

  // Bell with badge
  bellContainer: {
    position: 'relative',
    padding: Spacing.xs,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    ...Typography.small,
    fontSize: 10,
    color: 'white',
    fontWeight: '700',
  },
});
