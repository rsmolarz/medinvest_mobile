/**
 * Skeleton Loader Components
 * Placeholder loading states for better perceived performance
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useThemeContext } from '@/contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Base skeleton component with shimmer animation
interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = BorderRadius.sm,
  style,
}: SkeletonProps) {
  const { colors, isDark } = useThemeContext();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  const backgroundColor = isDark ? colors.backgroundSecondary : '#E8EAED';
  const shimmerColors = isDark 
    ? ['transparent', 'rgba(255,255,255,0.05)', 'transparent']
    : ['transparent', 'rgba(255,255,255,0.5)', 'transparent'];

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          { transform: [{ translateX }] },
        ]}
      >
        <LinearGradient
          colors={shimmerColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

// Circle skeleton (for avatars)
interface CircleSkeletonProps {
  size?: number;
  style?: ViewStyle;
}

export function CircleSkeleton({ size = 48, style }: CircleSkeletonProps) {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
}

// Post card skeleton
export function PostCardSkeleton() {
  const { colors } = useThemeContext();
  
  return (
    <View style={[styles.postCard, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={styles.postHeader}>
        <CircleSkeleton size={44} />
        <View style={styles.postHeaderText}>
          <Skeleton width={120} height={14} />
          <Skeleton width={80} height={12} style={{ marginTop: 6 }} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.postContent}>
        <Skeleton width="100%" height={14} />
        <Skeleton width="90%" height={14} style={{ marginTop: 8 }} />
        <Skeleton width="75%" height={14} style={{ marginTop: 8 }} />
      </View>

      {/* Actions */}
      <View style={styles.postActions}>
        <Skeleton width={60} height={24} borderRadius={12} />
        <Skeleton width={60} height={24} borderRadius={12} />
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

// Feed skeleton (multiple posts)
interface FeedSkeletonProps {
  count?: number;
}

export function FeedSkeleton({ count = 3 }: FeedSkeletonProps) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <PostCardSkeleton key={index} />
      ))}
    </View>
  );
}

// User list item skeleton
export function UserListItemSkeleton() {
  const { colors } = useThemeContext();
  
  return (
    <View style={[styles.userListItem, { borderBottomColor: colors.border }]}>
      <CircleSkeleton size={48} />
      <View style={styles.userListContent}>
        <Skeleton width={140} height={14} />
        <Skeleton width={100} height={12} style={{ marginTop: 6 }} />
      </View>
      <Skeleton width={70} height={32} borderRadius={16} />
    </View>
  );
}

// User list skeleton
interface UserListSkeletonProps {
  count?: number;
}

export function UserListSkeleton({ count = 5 }: UserListSkeletonProps) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <UserListItemSkeleton key={index} />
      ))}
    </View>
  );
}

// Message/conversation skeleton
export function ConversationItemSkeleton() {
  const { colors } = useThemeContext();
  
  return (
    <View style={[styles.conversationItem, { borderBottomColor: colors.border }]}>
      <CircleSkeleton size={52} />
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Skeleton width={120} height={14} />
          <Skeleton width={40} height={12} />
        </View>
        <Skeleton width="80%" height={12} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

// Messages list skeleton
export function MessagesListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <ConversationItemSkeleton key={index} />
      ))}
    </View>
  );
}

// Notification item skeleton
export function NotificationItemSkeleton() {
  const { colors } = useThemeContext();
  
  return (
    <View style={[styles.notificationItem, { backgroundColor: colors.surface }]}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <View style={styles.notificationContent}>
        <Skeleton width="90%" height={14} />
        <Skeleton width="60%" height={12} style={{ marginTop: 6 }} />
        <Skeleton width={60} height={10} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

// Notifications list skeleton
export function NotificationsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <NotificationItemSkeleton key={index} />
      ))}
    </View>
  );
}

// Deal card skeleton
export function DealCardSkeleton() {
  const { colors } = useThemeContext();
  
  return (
    <View style={[styles.dealCard, { backgroundColor: colors.surface }]}>
      <Skeleton width="100%" height={120} borderRadius={BorderRadius.md} />
      <View style={styles.dealContent}>
        <Skeleton width="70%" height={16} style={{ marginTop: Spacing.md }} />
        <Skeleton width="50%" height={12} style={{ marginTop: 6 }} />
        <View style={styles.dealMeta}>
          <Skeleton width={80} height={24} borderRadius={12} />
          <Skeleton width={60} height={24} borderRadius={12} />
        </View>
        {/* Progress bar */}
        <Skeleton width="100%" height={8} borderRadius={4} style={{ marginTop: Spacing.md }} />
      </View>
    </View>
  );
}

// Deals list skeleton
export function DealsListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.dealsList}>
      {Array.from({ length: count }).map((_, index) => (
        <DealCardSkeleton key={index} />
      ))}
    </View>
  );
}

// Profile header skeleton
export function ProfileHeaderSkeleton() {
  const { colors } = useThemeContext();
  
  return (
    <View style={[styles.profileHeader, { backgroundColor: colors.surface }]}>
      {/* Cover */}
      <Skeleton width="100%" height={120} borderRadius={0} />
      
      {/* Avatar */}
      <View style={styles.profileAvatarContainer}>
        <CircleSkeleton size={100} style={styles.profileAvatar} />
      </View>
      
      {/* Info */}
      <View style={styles.profileInfo}>
        <Skeleton width={150} height={20} />
        <Skeleton width={100} height={14} style={{ marginTop: 8 }} />
        <Skeleton width={200} height={12} style={{ marginTop: 12 }} />
        
        {/* Stats */}
        <View style={styles.profileStats}>
          <View style={styles.profileStat}>
            <Skeleton width={40} height={18} />
            <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
          </View>
          <View style={styles.profileStat}>
            <Skeleton width={40} height={18} />
            <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
          </View>
          <View style={styles.profileStat}>
            <Skeleton width={40} height={18} />
            <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
          </View>
        </View>
      </View>
    </View>
  );
}

// Comment skeleton
export function CommentSkeleton() {
  return (
    <View style={styles.comment}>
      <CircleSkeleton size={36} />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Skeleton width={100} height={12} />
          <Skeleton width={50} height={10} />
        </View>
        <Skeleton width="100%" height={12} style={{ marginTop: 6 }} />
        <Skeleton width="70%" height={12} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

// Comments list skeleton
export function CommentsListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <CommentSkeleton key={index} />
      ))}
    </View>
  );
}

// Room/hashtag item skeleton
export function RoomItemSkeleton() {
  const { colors } = useThemeContext();
  
  return (
    <View style={[styles.roomItem, { borderBottomColor: colors.border }]}>
      <Skeleton width={48} height={48} borderRadius={12} />
      <View style={styles.roomContent}>
        <Skeleton width={120} height={14} />
        <Skeleton width={180} height={12} style={{ marginTop: 6 }} />
        <Skeleton width={80} height={10} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

// Search results skeleton
export function SearchResultsSkeleton() {
  return (
    <View>
      <View style={styles.searchSection}>
        <Skeleton width={80} height={12} style={{ marginBottom: Spacing.md }} />
        <UserListSkeleton count={3} />
      </View>
      <View style={styles.searchSection}>
        <Skeleton width={80} height={12} style={{ marginBottom: Spacing.md }} />
        <FeedSkeleton count={2} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
  },

  // Post card
  postCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postHeaderText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  postContent: {
    marginTop: Spacing.lg,
  },
  postActions: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },

  // User list item
  userListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  userListContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },

  // Conversation item
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  conversationContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Notification item
  notificationItem: {
    flexDirection: 'row',
    padding: Spacing.lg,
  },
  notificationContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },

  // Deal card
  dealCard: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  dealContent: {
    padding: Spacing.md,
  },
  dealMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  dealsList: {
    padding: Spacing.lg,
  },

  // Profile header
  profileHeader: {
    paddingBottom: Spacing.xl,
  },
  profileAvatarContainer: {
    alignItems: 'center',
    marginTop: -50,
  },
  profileAvatar: {
    borderWidth: 4,
    borderColor: Colors.surface,
  },
  profileInfo: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  profileStats: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
    gap: Spacing.xl,
  },
  profileStat: {
    alignItems: 'center',
  },

  // Comment
  comment: {
    flexDirection: 'row',
    padding: Spacing.md,
  },
  commentContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  // Room item
  roomItem: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  roomContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },

  // Search
  searchSection: {
    padding: Spacing.lg,
  },
});
