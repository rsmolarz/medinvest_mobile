/**
 * Pinned Posts
 * Pin important posts to profile
 */

import React, { useState, useCallback, memo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useThemeContext } from '@/contexts/ThemeContext';
import { haptics } from '@/lib/haptics';
import { postsApi } from '@/lib/api';

// Types
export interface PinnedPost {
  postId: number;
  pinnedAt: string;
  order: number;
}

const MAX_PINNED_POSTS = 3;
const PINNED_POSTS_KEY = 'pinned_posts';

// =============================================================================
// PINNED POSTS SERVICE
// =============================================================================

class PinnedPostsService {
  private pinnedPosts: Map<number, PinnedPost[]> = new Map(); // userId -> posts
  private loaded: Set<number> = new Set();

  async loadPinnedPosts(userId: number): Promise<PinnedPost[]> {
    if (this.loaded.has(userId)) {
      return this.pinnedPosts.get(userId) || [];
    }

    try {
      const key = `${PINNED_POSTS_KEY}_${userId}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const posts = JSON.parse(stored) as PinnedPost[];
        this.pinnedPosts.set(userId, posts);
        this.loaded.add(userId);
        return posts;
      }
    } catch (error) {
      console.error('[PinnedPosts] Error loading:', error);
    }
    return [];
  }

  private async persist(userId: number): Promise<void> {
    try {
      const key = `${PINNED_POSTS_KEY}_${userId}`;
      const posts = this.pinnedPosts.get(userId) || [];
      await AsyncStorage.setItem(key, JSON.stringify(posts));
    } catch (error) {
      console.error('[PinnedPosts] Error saving:', error);
    }
  }

  async pinPost(userId: number, postId: number): Promise<boolean> {
    const posts = await this.loadPinnedPosts(userId);
    
    // Check if already pinned
    if (posts.some(p => p.postId === postId)) {
      return true;
    }

    // Check max limit
    if (posts.length >= MAX_PINNED_POSTS) {
      return false;
    }

    const newPost: PinnedPost = {
      postId,
      pinnedAt: new Date().toISOString(),
      order: posts.length,
    };

    posts.push(newPost);
    this.pinnedPosts.set(userId, posts);
    await this.persist(userId);

    // TODO: Sync with backend
    // await postsApi.pinPost(postId);

    return true;
  }

  async unpinPost(userId: number, postId: number): Promise<void> {
    const posts = await this.loadPinnedPosts(userId);
    const filtered = posts.filter(p => p.postId !== postId);
    
    // Reorder remaining posts
    filtered.forEach((post, index) => {
      post.order = index;
    });

    this.pinnedPosts.set(userId, filtered);
    await this.persist(userId);

    // TODO: Sync with backend
    // await postsApi.unpinPost(postId);
  }

  async reorderPinnedPosts(userId: number, postIds: number[]): Promise<void> {
    const posts = await this.loadPinnedPosts(userId);
    
    // Create new order based on postIds array
    const reordered = postIds
      .map((id, index) => {
        const post = posts.find(p => p.postId === id);
        if (post) {
          return { ...post, order: index };
        }
        return null;
      })
      .filter(Boolean) as PinnedPost[];

    this.pinnedPosts.set(userId, reordered);
    await this.persist(userId);
  }

  async isPostPinned(userId: number, postId: number): Promise<boolean> {
    const posts = await this.loadPinnedPosts(userId);
    return posts.some(p => p.postId === postId);
  }

  async getPinnedPostIds(userId: number): Promise<number[]> {
    const posts = await this.loadPinnedPosts(userId);
    return posts.sort((a, b) => a.order - b.order).map(p => p.postId);
  }

  async canPinMore(userId: number): Promise<boolean> {
    const posts = await this.loadPinnedPosts(userId);
    return posts.length < MAX_PINNED_POSTS;
  }

  getMaxPinnedPosts(): number {
    return MAX_PINNED_POSTS;
  }
}

export const pinnedPostsService = new PinnedPostsService();

// =============================================================================
// PIN POST BUTTON
// =============================================================================

interface PinPostButtonProps {
  postId: number;
  userId: number;
  isOwner: boolean;
  size?: 'small' | 'medium';
  onPinChange?: (isPinned: boolean) => void;
}

export const PinPostButton = memo(function PinPostButton({
  postId,
  userId,
  isOwner,
  size = 'medium',
  onPinChange,
}: PinPostButtonProps) {
  const { colors } = useThemeContext();
  const queryClient = useQueryClient();
  const [isPinned, setIsPinned] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPinStatus();
  }, [postId, userId]);

  const checkPinStatus = async () => {
    setIsLoading(true);
    const pinned = await pinnedPostsService.isPostPinned(userId, postId);
    setIsPinned(pinned);
    setIsLoading(false);
  };

  const handleTogglePin = useCallback(async () => {
    if (!isOwner) return;

    haptics.buttonPress();

    if (isPinned) {
      // Unpin
      await pinnedPostsService.unpinPost(userId, postId);
      setIsPinned(false);
      onPinChange?.(false);
      haptics.success();
    } else {
      // Check if can pin more
      const canPin = await pinnedPostsService.canPinMore(userId);
      if (!canPin) {
        haptics.warning();
        Alert.alert(
          'Maximum Pinned Posts',
          `You can only pin up to ${MAX_PINNED_POSTS} posts. Unpin another post first.`
        );
        return;
      }

      // Pin
      await pinnedPostsService.pinPost(userId, postId);
      setIsPinned(true);
      onPinChange?.(true);
      haptics.success();
    }

    queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    queryClient.invalidateQueries({ queryKey: ['pinnedPosts', userId] });
  }, [isPinned, isOwner, postId, userId, onPinChange, queryClient]);

  if (!isOwner) return null;

  const iconSize = size === 'small' ? 18 : 22;

  return (
    <TouchableOpacity
      style={styles.pinButton}
      onPress={handleTogglePin}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.textSecondary} />
      ) : (
        <Ionicons
          name={isPinned ? 'pin' : 'pin-outline'}
          size={iconSize}
          color={isPinned ? colors.primary : colors.textSecondary}
        />
      )}
    </TouchableOpacity>
  );
});

// =============================================================================
// PINNED POSTS SECTION (For Profile)
// =============================================================================

interface PinnedPostsSectionProps {
  userId: number;
  isOwner: boolean;
  onPostPress: (postId: number) => void;
  renderPost: (postId: number) => React.ReactNode;
}

export const PinnedPostsSection = memo(function PinnedPostsSection({
  userId,
  isOwner,
  onPostPress,
  renderPost,
}: PinnedPostsSectionProps) {
  const { colors } = useThemeContext();
  const [pinnedPostIds, setPinnedPostIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPinnedPosts();
  }, [userId]);

  const loadPinnedPosts = async () => {
    setIsLoading(true);
    const ids = await pinnedPostsService.getPinnedPostIds(userId);
    setPinnedPostIds(ids);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (pinnedPostIds.length === 0) {
    if (!isOwner) return null;
    
    return (
      <View style={[styles.emptyPinnedSection, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name="pin-outline" size={24} color={colors.textSecondary} />
        <ThemedText style={[styles.emptyPinnedText, { color: colors.textSecondary }]}>
          Pin up to {MAX_PINNED_POSTS} posts to show them here
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.pinnedSection}>
      {/* Header */}
      <View style={styles.pinnedHeader}>
        <Ionicons name="pin" size={16} color={colors.primary} />
        <ThemedText style={[styles.pinnedHeaderText, { color: colors.textPrimary }]}>
          Pinned Posts
        </ThemedText>
      </View>

      {/* Posts */}
      <View style={styles.pinnedPostsContainer}>
        {pinnedPostIds.map((postId) => (
          <View key={postId} style={styles.pinnedPostWrapper}>
            {renderPost(postId)}
          </View>
        ))}
      </View>
    </View>
  );
});

// =============================================================================
// PIN INDICATOR BADGE
// =============================================================================

interface PinIndicatorProps {
  isPinned: boolean;
  size?: 'small' | 'medium';
}

export const PinIndicator = memo(function PinIndicator({
  isPinned,
  size = 'small',
}: PinIndicatorProps) {
  const { colors } = useThemeContext();

  if (!isPinned) return null;

  return (
    <View style={[styles.pinIndicator, { backgroundColor: colors.primary + '20' }]}>
      <Ionicons name="pin" size={size === 'small' ? 12 : 14} color={colors.primary} />
      <ThemedText style={[styles.pinIndicatorText, { color: colors.primary }]}>
        Pinned
      </ThemedText>
    </View>
  );
});

// =============================================================================
// PIN POST ACTION SHEET OPTION
// =============================================================================

interface PinPostMenuItemProps {
  postId: number;
  userId: number;
  onAction: () => void;
}

export const PinPostMenuItem = memo(function PinPostMenuItem({
  postId,
  userId,
  onAction,
}: PinPostMenuItemProps) {
  const { colors } = useThemeContext();
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    checkPinStatus();
  }, [postId, userId]);

  const checkPinStatus = async () => {
    const pinned = await pinnedPostsService.isPostPinned(userId, postId);
    setIsPinned(pinned);
  };

  const handlePress = async () => {
    haptics.buttonPress();

    if (isPinned) {
      await pinnedPostsService.unpinPost(userId, postId);
      haptics.success();
    } else {
      const canPin = await pinnedPostsService.canPinMore(userId);
      if (!canPin) {
        haptics.warning();
        Alert.alert(
          'Maximum Pinned Posts',
          `You can only pin up to ${MAX_PINNED_POSTS} posts. Unpin another post first.`
        );
        return;
      }
      await pinnedPostsService.pinPost(userId, postId);
      haptics.success();
    }

    onAction();
  };

  return (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: colors.border }]}
      onPress={handlePress}
    >
      <Ionicons
        name={isPinned ? 'pin-sharp' : 'pin-outline'}
        size={22}
        color={colors.textPrimary}
      />
      <ThemedText style={[styles.menuItemText, { color: colors.textPrimary }]}>
        {isPinned ? 'Unpin from profile' : 'Pin to profile'}
      </ThemedText>
    </TouchableOpacity>
  );
});

// =============================================================================
// HOOK
// =============================================================================

export function usePinnedPosts(userId: number) {
  const [pinnedPostIds, setPinnedPostIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPinnedPosts();
  }, [userId]);

  const loadPinnedPosts = async () => {
    setIsLoading(true);
    const ids = await pinnedPostsService.getPinnedPostIds(userId);
    setPinnedPostIds(ids);
    setIsLoading(false);
  };

  const pinPost = useCallback(async (postId: number) => {
    const success = await pinnedPostsService.pinPost(userId, postId);
    if (success) {
      setPinnedPostIds(prev => [...prev, postId]);
    }
    return success;
  }, [userId]);

  const unpinPost = useCallback(async (postId: number) => {
    await pinnedPostsService.unpinPost(userId, postId);
    setPinnedPostIds(prev => prev.filter(id => id !== postId));
  }, [userId]);

  const isPostPinned = useCallback((postId: number) => {
    return pinnedPostIds.includes(postId);
  }, [pinnedPostIds]);

  const canPinMore = useCallback(() => {
    return pinnedPostIds.length < MAX_PINNED_POSTS;
  }, [pinnedPostIds]);

  return {
    pinnedPostIds,
    isLoading,
    pinPost,
    unpinPost,
    isPostPinned,
    canPinMore,
    maxPinnedPosts: MAX_PINNED_POSTS,
    refresh: loadPinnedPosts,
  };
}

const styles = StyleSheet.create({
  // Pin button
  pinButton: {
    padding: Spacing.sm,
  },

  // Loading
  loadingContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
  },

  // Empty state
  emptyPinnedSection: {
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyPinnedText: {
    ...Typography.caption,
    flex: 1,
  },

  // Pinned section
  pinnedSection: {
    marginBottom: Spacing.lg,
  },
  pinnedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  pinnedHeaderText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  pinnedPostsContainer: {
    gap: Spacing.sm,
  },
  pinnedPostWrapper: {
    position: 'relative',
  },

  // Pin indicator
  pinIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  pinIndicatorText: {
    ...Typography.small,
    fontWeight: '600',
  },

  // Menu item
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  menuItemText: {
    ...Typography.body,
  },
});
