/**
 * Message Status Components
 * Read receipts and typing indicators for messaging
 */

import React, { useEffect, useRef, memo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useThemeContext } from '@/contexts/ThemeContext';

// =============================================================================
// READ RECEIPTS
// =============================================================================

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

interface ReadReceiptProps {
  status: MessageStatus;
  readAt?: string;
  size?: number;
}

export const ReadReceipt = memo(function ReadReceipt({
  status,
  readAt,
  size = 16,
}: ReadReceiptProps) {
  const { colors } = useThemeContext();

  const getIcon = () => {
    switch (status) {
      case 'sending':
        return { name: 'time-outline', color: colors.textSecondary };
      case 'sent':
        return { name: 'checkmark', color: colors.textSecondary };
      case 'delivered':
        return { name: 'checkmark-done', color: colors.textSecondary };
      case 'read':
        return { name: 'checkmark-done', color: colors.primary };
      case 'failed':
        return { name: 'alert-circle', color: colors.error };
      default:
        return { name: 'checkmark', color: colors.textSecondary };
    }
  };

  const icon = getIcon();

  return (
    <View style={styles.readReceipt}>
      <Ionicons name={icon.name as any} size={size} color={icon.color} />
    </View>
  );
});

// Read receipt with avatars (for group chats or detailed view)
interface ReadReceiptWithAvatarsProps {
  readBy: Array<{
    id: number;
    full_name: string;
    avatar_url?: string;
    read_at: string;
  }>;
  totalRecipients: number;
  maxAvatars?: number;
}

export const ReadReceiptWithAvatars = memo(function ReadReceiptWithAvatars({
  readBy,
  totalRecipients,
  maxAvatars = 3,
}: ReadReceiptWithAvatarsProps) {
  const { colors } = useThemeContext();
  const displayedAvatars = readBy.slice(0, maxAvatars);
  const remainingCount = readBy.length - maxAvatars;

  if (readBy.length === 0) {
    return (
      <View style={styles.avatarReceipts}>
        <Ionicons name="checkmark-done" size={14} color={colors.textSecondary} />
        <ThemedText style={[styles.receiptText, { color: colors.textSecondary }]}>
          Delivered
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.avatarReceipts}>
      <ThemedText style={[styles.receiptText, { color: colors.textSecondary }]}>
        Seen by
      </ThemedText>
      <View style={styles.avatarStack}>
        {displayedAvatars.map((user, index) => (
          <View
            key={user.id}
            style={[
              styles.stackedAvatar,
              { marginLeft: index > 0 ? -8 : 0, zIndex: maxAvatars - index },
            ]}
          >
            {user.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.miniAvatar} />
            ) : (
              <View style={[styles.miniAvatar, styles.miniAvatarPlaceholder, { backgroundColor: colors.primary }]}>
                <ThemedText style={styles.miniAvatarText}>
                  {user.full_name[0]}
                </ThemedText>
              </View>
            )}
          </View>
        ))}
        {remainingCount > 0 && (
          <View style={[styles.stackedAvatar, styles.remainingBadge, { marginLeft: -8, backgroundColor: colors.backgroundSecondary }]}>
            <ThemedText style={[styles.remainingText, { color: colors.textSecondary }]}>
              +{remainingCount}
            </ThemedText>
          </View>
        )}
      </View>
      {readBy.length === totalRecipients && totalRecipients > 1 && (
        <ThemedText style={[styles.allReadText, { color: colors.textSecondary }]}>
          All
        </ThemedText>
      )}
    </View>
  );
});

// =============================================================================
// TYPING INDICATORS
// =============================================================================

interface TypingIndicatorProps {
  users?: Array<{ id: number; full_name: string }>;
  isTyping?: boolean;
}

export const TypingIndicator = memo(function TypingIndicator({
  users = [],
  isTyping = false,
}: TypingIndicatorProps) {
  const { colors } = useThemeContext();

  if (!isTyping && users.length === 0) return null;

  const getTypingText = () => {
    if (users.length === 0) return 'typing';
    if (users.length === 1) return `${users[0].full_name.split(' ')[0]} is typing`;
    if (users.length === 2) {
      return `${users[0].full_name.split(' ')[0]} and ${users[1].full_name.split(' ')[0]} are typing`;
    }
    return `${users.length} people are typing`;
  };

  return (
    <View style={styles.typingContainer}>
      <TypingDots />
      <ThemedText style={[styles.typingText, { color: colors.textSecondary }]}>
        {getTypingText()}
      </ThemedText>
    </View>
  );
});

// Animated typing dots
export const TypingDots = memo(function TypingDots() {
  const { colors } = useThemeContext();
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createDotAnimation = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation = Animated.parallel([
      createDotAnimation(dot1, 0),
      createDotAnimation(dot2, 150),
      createDotAnimation(dot3, 300),
    ]);

    animation.start();
    return () => animation.stop();
  }, []);

  const animatedStyle = (dot: Animated.Value) => ({
    transform: [
      {
        translateY: dot.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -4],
        }),
      },
    ],
  });

  return (
    <View style={styles.dotsContainer}>
      <Animated.View
        style={[styles.dot, { backgroundColor: colors.textSecondary }, animatedStyle(dot1)]}
      />
      <Animated.View
        style={[styles.dot, { backgroundColor: colors.textSecondary }, animatedStyle(dot2)]}
      />
      <Animated.View
        style={[styles.dot, { backgroundColor: colors.textSecondary }, animatedStyle(dot3)]}
      />
    </View>
  );
});

// Typing indicator bubble (for chat list)
interface TypingBubbleProps {
  size?: 'small' | 'medium';
}

export const TypingBubble = memo(function TypingBubble({
  size = 'medium',
}: TypingBubbleProps) {
  const { colors } = useThemeContext();
  const dotSize = size === 'small' ? 4 : 6;
  const containerPadding = size === 'small' ? Spacing.xs : Spacing.sm;

  return (
    <View 
      style={[
        styles.typingBubble, 
        { 
          backgroundColor: colors.backgroundSecondary,
          paddingHorizontal: containerPadding * 2,
          paddingVertical: containerPadding,
        }
      ]}
    >
      <TypingDotsSimple dotSize={dotSize} color={colors.textSecondary} />
    </View>
  );
});

// Simple typing dots (no vertical animation, just opacity)
const TypingDotsSimple = memo(function TypingDotsSimple({
  dotSize = 6,
  color = Colors.textSecondary,
}: {
  dotSize?: number;
  color?: string;
}) {
  const opacity1 = useRef(new Animated.Value(0.3)).current;
  const opacity2 = useRef(new Animated.Value(0.3)).current;
  const opacity3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const createAnimation = (value: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation = Animated.parallel([
      createAnimation(opacity1, 0),
      createAnimation(opacity2, 200),
      createAnimation(opacity3, 400),
    ]);

    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <View style={styles.simpleDotsContainer}>
      <Animated.View
        style={[
          styles.simpleDot,
          { width: dotSize, height: dotSize, backgroundColor: color, opacity: opacity1 },
        ]}
      />
      <Animated.View
        style={[
          styles.simpleDot,
          { width: dotSize, height: dotSize, backgroundColor: color, opacity: opacity2 },
        ]}
      />
      <Animated.View
        style={[
          styles.simpleDot,
          { width: dotSize, height: dotSize, backgroundColor: color, opacity: opacity3 },
        ]}
      />
    </View>
  );
});

// =============================================================================
// MESSAGE TIMESTAMP WITH STATUS
// =============================================================================

interface MessageTimestampProps {
  timestamp: string;
  status?: MessageStatus;
  isOwn?: boolean;
}

export const MessageTimestamp = memo(function MessageTimestamp({
  timestamp,
  status,
  isOwn = false,
}: MessageTimestampProps) {
  const { colors } = useThemeContext();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.timestampContainer}>
      <ThemedText style={[styles.timestamp, { color: colors.textSecondary }]}>
        {formatTime(timestamp)}
      </ThemedText>
      {isOwn && status && <ReadReceipt status={status} size={14} />}
    </View>
  );
});

// =============================================================================
// ONLINE STATUS INDICATOR
// =============================================================================

interface OnlineStatusProps {
  isOnline: boolean;
  lastSeen?: string;
  size?: number;
  showBorder?: boolean;
}

export const OnlineStatus = memo(function OnlineStatus({
  isOnline,
  lastSeen,
  size = 12,
  showBorder = true,
}: OnlineStatusProps) {
  const { colors } = useThemeContext();

  return (
    <View
      style={[
        styles.onlineIndicator,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isOnline ? Colors.secondary : colors.textSecondary,
          borderWidth: showBorder ? 2 : 0,
          borderColor: colors.surface,
        },
      ]}
    />
  );
});

// Last seen text
interface LastSeenTextProps {
  isOnline: boolean;
  lastSeen?: string;
}

export const LastSeenText = memo(function LastSeenText({
  isOnline,
  lastSeen,
}: LastSeenTextProps) {
  const { colors } = useThemeContext();

  if (isOnline) {
    return (
      <ThemedText style={[styles.lastSeenText, { color: Colors.secondary }]}>
        Online
      </ThemedText>
    );
  }

  if (!lastSeen) return null;

  const formatLastSeen = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <ThemedText style={[styles.lastSeenText, { color: colors.textSecondary }]}>
      Last seen {formatLastSeen(lastSeen)}
    </ThemedText>
  );
});

const styles = StyleSheet.create({
  // Read receipts
  readReceipt: {
    marginLeft: 4,
  },
  avatarReceipts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  receiptText: {
    ...Typography.small,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackedAvatar: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  miniAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.surface,
  },
  miniAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: {
    ...Typography.small,
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  remainingBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remainingText: {
    ...Typography.small,
    fontSize: 10,
    fontWeight: '600',
  },
  allReadText: {
    ...Typography.small,
  },

  // Typing indicator
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  typingText: {
    ...Typography.small,
    fontStyle: 'italic',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  typingBubble: {
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  simpleDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  simpleDot: {
    borderRadius: 100,
  },

  // Timestamp
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  timestamp: {
    ...Typography.small,
    fontSize: 11,
  },

  // Online status
  onlineIndicator: {},
  lastSeenText: {
    ...Typography.small,
  },
});
