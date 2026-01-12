/**
 * Reactions Component
 * Emoji reactions beyond upvote/downvote
 */

import React, { useState, useCallback, memo, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Modal,
  Animated,
  PanResponder,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useThemeContext } from '@/contexts/ThemeContext';
import { haptics } from '@/lib/haptics';
import { postsApi } from '@/lib/api';

// Available reactions
export const REACTIONS = [
  { id: 'like', emoji: '👍', label: 'Like' },
  { id: 'love', emoji: '❤️', label: 'Love' },
  { id: 'laugh', emoji: '😂', label: 'Haha' },
  { id: 'wow', emoji: '😮', label: 'Wow' },
  { id: 'sad', emoji: '😢', label: 'Sad' },
  { id: 'fire', emoji: '🔥', label: 'Fire' },
  { id: 'thinking', emoji: '🤔', label: 'Thinking' },
  { id: 'clap', emoji: '👏', label: 'Clap' },
] as const;

export type ReactionType = typeof REACTIONS[number]['id'];

// Types
export interface ReactionCount {
  type: ReactionType;
  count: number;
}

export interface UserReaction {
  type: ReactionType;
  userId: number;
  userName: string;
  avatar?: string;
}

interface ReactionsProps {
  postId: number;
  reactions: ReactionCount[];
  userReaction?: ReactionType;
  totalReactions: number;
  onReactionChange?: (reaction: ReactionType | null) => void;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
}

interface ReactionPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (reaction: ReactionType) => void;
  currentReaction?: ReactionType;
  anchorPosition?: { x: number; y: number };
}

interface ReactionSummaryProps {
  reactions: ReactionCount[];
  totalReactions: number;
  onPress?: () => void;
}

// =============================================================================
// REACTION PICKER (Floating emoji selector)
// =============================================================================

export const ReactionPicker = memo(function ReactionPicker({
  visible,
  onClose,
  onSelect,
  currentReaction,
  anchorPosition,
}: ReactionPickerProps) {
  const { colors } = useThemeContext();
  const scaleAnims = useRef(REACTIONS.map(() => new Animated.Value(0))).current;
  const containerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate container in
      Animated.spring(containerAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();

      // Stagger emoji animations
      REACTIONS.forEach((_, index) => {
        Animated.sequence([
          Animated.delay(index * 30),
          Animated.spring(scaleAnims[index], {
            toValue: 1,
            friction: 5,
            tension: 150,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      // Reset animations
      containerAnim.setValue(0);
      scaleAnims.forEach(anim => anim.setValue(0));
    }
  }, [visible]);

  const handleSelect = (reaction: ReactionType) => {
    haptics.selection();
    onSelect(reaction);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.pickerOverlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.pickerContainer,
            {
              backgroundColor: colors.surface,
              transform: [{ scale: containerAnim }],
              opacity: containerAnim,
            },
          ]}
        >
          {REACTIONS.map((reaction, index) => (
            <Animated.View
              key={reaction.id}
              style={{
                transform: [{ scale: scaleAnims[index] }],
              }}
            >
              <TouchableOpacity
                style={[
                  styles.reactionOption,
                  currentReaction === reaction.id && {
                    backgroundColor: colors.primary + '20',
                  },
                ]}
                onPress={() => handleSelect(reaction.id)}
                activeOpacity={0.7}
              >
                <ThemedText style={styles.reactionEmoji}>{reaction.emoji}</ThemedText>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>
      </Pressable>
    </Modal>
  );
});

// =============================================================================
// REACTION BUTTON (Main interaction point)
// =============================================================================

export const ReactionButton = memo(function ReactionButton({
  postId,
  reactions,
  userReaction,
  totalReactions,
  onReactionChange,
  size = 'medium',
  showCount = true,
}: ReactionsProps) {
  const { colors } = useThemeContext();
  const queryClient = useQueryClient();
  const [showPicker, setShowPicker] = useState(false);
  const [localReaction, setLocalReaction] = useState<ReactionType | undefined>(userReaction);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<View>(null);

  // React mutation
  const reactMutation = useMutation({
    mutationFn: async (type: ReactionType | null) => {
      if (type) {
        return postsApi.react(postId, type);
      } else {
        return postsApi.removeReaction(postId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const handlePress = () => {
    haptics.like();
    
    if (localReaction) {
      // Remove reaction
      setLocalReaction(undefined);
      onReactionChange?.(null);
      reactMutation.mutate(null);
    } else {
      // Quick like
      setLocalReaction('like');
      onReactionChange?.('like');
      reactMutation.mutate('like');
    }
  };

  const handleLongPress = () => {
    haptics.longPress();
    setShowPicker(true);
  };

  const handleSelectReaction = (type: ReactionType) => {
    if (type === localReaction) {
      // Remove if same
      setLocalReaction(undefined);
      onReactionChange?.(null);
      reactMutation.mutate(null);
    } else {
      setLocalReaction(type);
      onReactionChange?.(type);
      reactMutation.mutate(type);
    }
  };

  const currentReaction = REACTIONS.find(r => r.id === localReaction);
  const iconSize = size === 'small' ? 18 : size === 'large' ? 26 : 22;

  return (
    <>
      <TouchableOpacity
        ref={buttonRef}
        style={styles.reactionButton}
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={300}
        activeOpacity={0.7}
      >
        {localReaction ? (
          <ThemedText style={[styles.activeReaction, { fontSize: iconSize }]}>
            {currentReaction?.emoji}
          </ThemedText>
        ) : (
          <Ionicons name="heart-outline" size={iconSize} color={colors.textSecondary} />
        )}
        {showCount && totalReactions > 0 && (
          <ThemedText
            style={[
              styles.reactionCount,
              { color: localReaction ? colors.primary : colors.textSecondary },
            ]}
          >
            {totalReactions}
          </ThemedText>
        )}
      </TouchableOpacity>

      <ReactionPicker
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleSelectReaction}
        currentReaction={localReaction}
      />
    </>
  );
});

// =============================================================================
// REACTION SUMMARY (Shows who reacted)
// =============================================================================

export const ReactionSummary = memo(function ReactionSummary({
  reactions,
  totalReactions,
  onPress,
}: ReactionSummaryProps) {
  const { colors } = useThemeContext();

  if (totalReactions === 0) return null;

  // Get top 3 reactions by count
  const topReactions = [...reactions]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <TouchableOpacity style={styles.summaryContainer} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.emojiStack}>
        {topReactions.map((reaction, index) => {
          const reactionData = REACTIONS.find(r => r.id === reaction.type);
          return (
            <View
              key={reaction.type}
              style={[
                styles.stackedEmoji,
                {
                  backgroundColor: colors.surface,
                  marginLeft: index > 0 ? -6 : 0,
                  zIndex: 3 - index,
                },
              ]}
            >
              <ThemedText style={styles.smallEmoji}>{reactionData?.emoji}</ThemedText>
            </View>
          );
        })}
      </View>
      <ThemedText style={[styles.summaryText, { color: colors.textSecondary }]}>
        {totalReactions}
      </ThemedText>
    </TouchableOpacity>
  );
});

// =============================================================================
// REACTION DETAILS MODAL (Shows all who reacted)
// =============================================================================

interface ReactionDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  reactions: UserReaction[];
  postId: number;
}

export const ReactionDetailsModal = memo(function ReactionDetailsModal({
  visible,
  onClose,
  reactions,
  postId,
}: ReactionDetailsModalProps) {
  const { colors } = useThemeContext();
  const [activeTab, setActiveTab] = useState<ReactionType | 'all'>('all');

  // Group by reaction type
  const grouped = REACTIONS.reduce((acc, r) => {
    acc[r.id] = reactions.filter(ur => ur.type === r.id);
    return acc;
  }, {} as Record<ReactionType, UserReaction[]>);

  const displayReactions = activeTab === 'all' 
    ? reactions 
    : grouped[activeTab] || [];

  // Count per type
  const counts = REACTIONS.map(r => ({
    ...r,
    count: grouped[r.id]?.length || 0,
  })).filter(r => r.count > 0);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <ThemedText style={[styles.modalTitle, { color: colors.textPrimary }]}>
            Reactions
          </ThemedText>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && { borderBottomColor: colors.primary }]}
            onPress={() => setActiveTab('all')}
          >
            <ThemedText
              style={[
                styles.tabText,
                { color: activeTab === 'all' ? colors.primary : colors.textSecondary },
              ]}
            >
              All {reactions.length}
            </ThemedText>
          </TouchableOpacity>
          {counts.map(r => (
            <TouchableOpacity
              key={r.id}
              style={[styles.tab, activeTab === r.id && { borderBottomColor: colors.primary }]}
              onPress={() => setActiveTab(r.id)}
            >
              <ThemedText style={styles.tabEmoji}>{r.emoji}</ThemedText>
              <ThemedText
                style={[
                  styles.tabCount,
                  { color: activeTab === r.id ? colors.primary : colors.textSecondary },
                ]}
              >
                {r.count}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* User list */}
        <View style={styles.userList}>
          {displayReactions.map((reaction, index) => {
            const reactionData = REACTIONS.find(r => r.id === reaction.type);
            return (
              <View
                key={`${reaction.userId}-${reaction.type}`}
                style={[styles.userRow, { borderBottomColor: colors.border }]}
              >
                {reaction.avatar ? (
                  <Image source={{ uri: reaction.avatar }} style={styles.userAvatar} />
                ) : (
                  <View style={[styles.userAvatar, styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                    <ThemedText style={styles.avatarText}>
                      {reaction.userName[0]}
                    </ThemedText>
                  </View>
                )}
                <ThemedText style={[styles.userName, { color: colors.textPrimary }]}>
                  {reaction.userName}
                </ThemedText>
                <ThemedText style={styles.userReactionEmoji}>
                  {reactionData?.emoji}
                </ThemedText>
              </View>
            );
          })}
        </View>
      </View>
    </Modal>
  );
});

// =============================================================================
// QUICK REACTION BAR (For inline use)
// =============================================================================

interface QuickReactionBarProps {
  postId: number;
  userReaction?: ReactionType;
  onReact: (type: ReactionType | null) => void;
  compact?: boolean;
}

export const QuickReactionBar = memo(function QuickReactionBar({
  postId,
  userReaction,
  onReact,
  compact = false,
}: QuickReactionBarProps) {
  const { colors } = useThemeContext();

  const handleReact = (type: ReactionType) => {
    haptics.selection();
    if (type === userReaction) {
      onReact(null);
    } else {
      onReact(type);
    }
  };

  const displayReactions = compact ? REACTIONS.slice(0, 5) : REACTIONS;

  return (
    <View style={[styles.quickBar, { backgroundColor: colors.surface }]}>
      {displayReactions.map(reaction => (
        <TouchableOpacity
          key={reaction.id}
          style={[
            styles.quickReaction,
            userReaction === reaction.id && {
              backgroundColor: colors.primary + '20',
            },
          ]}
          onPress={() => handleReact(reaction.id)}
        >
          <ThemedText style={styles.quickEmoji}>{reaction.emoji}</ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  // Picker
  pickerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  pickerContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    ...Shadows.card,
  },
  reactionOption: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  reactionEmoji: {
    fontSize: 28,
  },

  // Button
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  activeReaction: {
    lineHeight: 26,
  },
  reactionCount: {
    ...Typography.caption,
    fontWeight: '600',
  },

  // Summary
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  emojiStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackedEmoji: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'white',
  },
  smallEmoji: {
    fontSize: 12,
  },
  summaryText: {
    ...Typography.small,
  },

  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...Typography.heading,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 4,
  },
  tabText: {
    ...Typography.body,
    fontWeight: '600',
  },
  tabEmoji: {
    fontSize: 18,
  },
  tabCount: {
    ...Typography.caption,
    fontWeight: '600',
  },
  userList: {
    flex: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontWeight: '600',
  },
  userName: {
    ...Typography.body,
    flex: 1,
    marginLeft: Spacing.md,
  },
  userReactionEmoji: {
    fontSize: 20,
  },

  // Quick bar
  quickBar: {
    flexDirection: 'row',
    borderRadius: BorderRadius.full,
    padding: Spacing.xs,
    ...Shadows.card,
  },
  quickReaction: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  quickEmoji: {
    fontSize: 22,
  },
});
