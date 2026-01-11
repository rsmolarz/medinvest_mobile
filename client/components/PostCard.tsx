/**
 * PostCard Component
 * Displays a single post with voting, comments, and interactions
 */

import React, { memo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Pressable,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { Post, VoteDirection } from '@/types';
import { formatRelativeTime, formatNumber } from '@/lib/utils';
import RichTextContent from './RichTextContent';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = width - Spacing.lg * 2;

interface PostCardProps {
  post: Post;
  onPress: () => void;
  onUserPress: () => void;
  onVote: (direction: VoteDirection) => void;
  onBookmark: () => void;
  onHashtagPress?: (tag: string) => void;
  onMentionPress?: (userId: number) => void;
  showFullContent?: boolean;
}

function PostCard({
  post,
  onPress,
  onUserPress,
  onVote,
  onBookmark,
  onHashtagPress,
  onMentionPress,
  showFullContent = false,
}: PostCardProps) {
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const score = post.upvotes - post.downvotes;
  const hasMultipleImages = post.images && post.images.length > 1;

  const handleUpvote = () => {
    onVote(post.user_vote === 'up' ? null : 'up');
  };

  const handleDownvote = () => {
    onVote(post.user_vote === 'down' ? null : 'down');
  };

  const renderAuthor = () => {
    if (post.is_anonymous) {
      return (
        <View style={styles.authorContainer}>
          <View style={[styles.avatar, styles.anonymousAvatar]}>
            <Ionicons name="person" size={20} color={Colors.textSecondary} />
          </View>
          <View style={styles.authorInfo}>
            <ThemedText style={styles.authorName}>
              {post.anonymous_name || 'Anonymous'}
            </ThemedText>
            <ThemedText style={styles.timestamp}>
              {formatRelativeTime(post.created_at)}
            </ThemedText>
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity style={styles.authorContainer} onPress={onUserPress}>
        {post.author.avatar_url ? (
          <Image source={{ uri: post.author.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <ThemedText style={styles.avatarText}>
              {post.author.first_name[0]}{post.author.last_name[0]}
            </ThemedText>
          </View>
        )}
        <View style={styles.authorInfo}>
          <View style={styles.authorNameRow}>
            <ThemedText style={styles.authorName}>{post.author.full_name}</ThemedText>
            {post.author.is_verified && (
              <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
            )}
            {post.author.is_premium && (
              <MaterialCommunityIcons name="crown" size={14} color={Colors.warning} />
            )}
          </View>
          <View style={styles.authorMeta}>
            {post.author.specialty && (
              <ThemedText style={styles.specialty}>{post.author.specialty}</ThemedText>
            )}
            <ThemedText style={styles.timestamp}>
              · {formatRelativeTime(post.created_at)}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRoom = () => (
    <View style={[styles.roomBadge, { backgroundColor: post.room.color + '20' }]}>
      <ThemedText style={styles.roomIcon}>{post.room.icon}</ThemedText>
      <ThemedText style={[styles.roomName, { color: post.room.color }]}>
        {post.room.name}
      </ThemedText>
    </View>
  );

  const renderImages = () => {
    if (!post.images || post.images.length === 0 || imageError) return null;

    if (post.images.length === 1) {
      return (
        <TouchableOpacity onPress={onPress} style={styles.imageContainer}>
          <Image
            source={{ uri: post.images[0] }}
            style={styles.singleImage}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.imageGallery}>
        <Image
          source={{ uri: post.images[currentImageIndex] }}
          style={styles.galleryImage}
          resizeMode="cover"
        />
        <View style={styles.imageIndicators}>
          {post.images.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.imageIndicator,
                index === currentImageIndex && styles.imageIndicatorActive,
              ]}
              onPress={() => setCurrentImageIndex(index)}
            />
          ))}
        </View>
        <View style={styles.imageCounter}>
          <ThemedText style={styles.imageCounterText}>
            {currentImageIndex + 1}/{post.images.length}
          </ThemedText>
        </View>
      </View>
    );
  };

  const renderActions = () => (
    <View style={styles.actions}>
      {/* Voting */}
      <View style={styles.voteContainer}>
        <TouchableOpacity
          style={[styles.voteButton, post.user_vote === 'up' && styles.voteButtonActive]}
          onPress={handleUpvote}
        >
          <Ionicons
            name={post.user_vote === 'up' ? 'arrow-up' : 'arrow-up-outline'}
            size={20}
            color={post.user_vote === 'up' ? Colors.secondary : Colors.textSecondary}
          />
        </TouchableOpacity>
        <ThemedText
          style={[
            styles.voteScore,
            score > 0 && styles.voteScorePositive,
            score < 0 && styles.voteScoreNegative,
          ]}
        >
          {formatNumber(score)}
        </ThemedText>
        <TouchableOpacity
          style={[styles.voteButton, post.user_vote === 'down' && styles.voteButtonActive]}
          onPress={handleDownvote}
        >
          <Ionicons
            name={post.user_vote === 'down' ? 'arrow-down' : 'arrow-down-outline'}
            size={20}
            color={post.user_vote === 'down' ? Colors.error : Colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Comments */}
      <TouchableOpacity style={styles.actionButton} onPress={onPress}>
        <Ionicons name="chatbubble-outline" size={20} color={Colors.textSecondary} />
        <ThemedText style={styles.actionText}>
          {formatNumber(post.comments_count)}
        </ThemedText>
      </TouchableOpacity>

      {/* Share */}
      <TouchableOpacity style={styles.actionButton}>
        <Ionicons name="share-outline" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>

      {/* Bookmark */}
      <TouchableOpacity style={styles.actionButton} onPress={onBookmark}>
        <Ionicons
          name={post.is_bookmarked ? 'bookmark' : 'bookmark-outline'}
          size={20}
          color={post.is_bookmarked ? Colors.primary : Colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        {renderAuthor()}
        {renderRoom()}
      </View>

      <RichTextContent
        content={post.content}
        mentions={post.mentions}
        hashtags={post.hashtags}
        onHashtagPress={onHashtagPress}
        onMentionPress={onMentionPress}
        numberOfLines={showFullContent ? undefined : 5}
        style={styles.content}
      />

      {renderImages()}
      {renderActions()}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: Spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  anonymousAvatar: {
    backgroundColor: Colors.light.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInfo: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  authorName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  authorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  specialty: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  timestamp: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  roomIcon: {
    fontSize: 12,
  },
  roomName: {
    ...Typography.small,
    fontWeight: '500',
  },
  content: {
    marginBottom: Spacing.md,
  },
  imageContainer: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  singleImage: {
    width: '100%',
    height: IMAGE_SIZE * 0.75,
    borderRadius: BorderRadius.sm,
  },
  imageGallery: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: IMAGE_SIZE * 0.75,
  },
  imageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: Spacing.md,
    left: 0,
    right: 0,
    gap: Spacing.xs,
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  imageIndicatorActive: {
    backgroundColor: 'white',
    width: 16,
  },
  imageCounter: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  imageCounterText: {
    ...Typography.small,
    color: 'white',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.md,
  },
  voteButton: {
    padding: Spacing.sm,
  },
  voteButtonActive: {
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: BorderRadius.full,
  },
  voteScore: {
    ...Typography.body,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'center',
    color: Colors.textPrimary,
  },
  voteScorePositive: {
    color: Colors.secondary,
  },
  voteScoreNegative: {
    color: Colors.error,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  actionText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});

export default memo(PostCard);
