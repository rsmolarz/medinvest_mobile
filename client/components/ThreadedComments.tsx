/**
 * Threaded Comments Component
 * Nested reply visualization for comments
 */

import React, { useState, useCallback, memo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { commentsApi } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface Comment {
  id: number;
  content: string;
  author: {
    id: number;
    full_name: string;
    avatar_url?: string;
    specialty?: string;
  };
  created_at: string;
  updated_at?: string;
  likes_count: number;
  is_liked: boolean;
  replies?: Comment[];
  replies_count: number;
  parent_id?: number;
  depth?: number;
}

interface ThreadedCommentsProps {
  comments: Comment[];
  postId: number;
  onUserPress: (userId: number) => void;
  maxDepth?: number;
}

export default function ThreadedComments({
  comments,
  postId,
  onUserPress,
  maxDepth = 3,
}: ThreadedCommentsProps) {
  return (
    <View style={styles.container}>
      {comments.map((comment) => (
        <CommentThread
          key={comment.id}
          comment={comment}
          postId={postId}
          onUserPress={onUserPress}
          depth={0}
          maxDepth={maxDepth}
        />
      ))}
    </View>
  );
}

interface CommentThreadProps {
  comment: Comment;
  postId: number;
  onUserPress: (userId: number) => void;
  depth: number;
  maxDepth: number;
}

const CommentThread = memo(function CommentThread({
  comment,
  postId,
  onUserPress,
  depth,
  maxDepth,
}: CommentThreadProps) {
  const appColors = useAppColors();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (comment.is_liked) {
        await commentsApi.unlike(comment.id);
      } else {
        await commentsApi.like(comment.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      if (!replyText.trim()) return;
      const response = await commentsApi.reply(postId, comment.id, replyText.trim());
      return response.data;
    },
    onSuccess: () => {
      setReplyText('');
      setShowReplyInput(false);
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });

  const handleToggleExpand = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const handleLike = useCallback(() => {
    likeMutation.mutate();
  }, [likeMutation]);

  const handleReply = useCallback(() => {
    setShowReplyInput(!showReplyInput);
  }, [showReplyInput]);

  const handleSubmitReply = useCallback(() => {
    if (replyText.trim()) {
      replyMutation.mutate();
    }
  }, [replyText, replyMutation]);

  const hasReplies = comment.replies && comment.replies.length > 0;
  const isMaxDepth = depth >= maxDepth;

  return (
    <View style={[styles.threadContainer, depth > 0 && [styles.nestedThread, { borderLeftColor: appColors.border }]]}>
      {depth > 0 && <View style={[styles.threadLine, { backgroundColor: appColors.border }]} />}
      
      <View style={styles.commentContainer}>
        <TouchableOpacity onPress={() => onUserPress(comment.author.id)}>
          {comment.author.avatar_url ? (
            <Image source={{ uri: comment.author.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <ThemedText style={styles.avatarText}>
                {comment.author.full_name.split(' ').map(n => n[0]).join('')}
              </ThemedText>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.contentContainer}>
          <View style={styles.commentHeader}>
            <TouchableOpacity onPress={() => onUserPress(comment.author.id)}>
              <ThemedText style={[styles.authorName, { color: appColors.textPrimary }]}>{comment.author.full_name}</ThemedText>
            </TouchableOpacity>
            <ThemedText style={[styles.timestamp, { color: appColors.textSecondary }]}>
              {formatRelativeTime(comment.created_at)}
            </ThemedText>
            {comment.updated_at && comment.updated_at !== comment.created_at && (
              <ThemedText style={[styles.editedBadge, { color: appColors.textSecondary }]}>(edited)</ThemedText>
            )}
          </View>

          <ThemedText style={[styles.commentText, { color: appColors.textPrimary }]}>{comment.content}</ThemedText>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleLike}
              disabled={likeMutation.isPending}
            >
              <Ionicons
                name={comment.is_liked ? 'heart' : 'heart-outline'}
                size={16}
                color={comment.is_liked ? appColors.error : appColors.textSecondary}
              />
              {comment.likes_count > 0 && (
                <ThemedText style={[
                  styles.actionText,
                  { color: appColors.textSecondary },
                  comment.is_liked && { color: appColors.error }
                ]}>
                  {comment.likes_count}
                </ThemedText>
              )}
            </TouchableOpacity>

            {!isMaxDepth && (
              <TouchableOpacity style={styles.actionButton} onPress={handleReply}>
                <Ionicons name="chatbubble-outline" size={16} color={appColors.textSecondary} />
                <ThemedText style={[styles.actionText, { color: appColors.textSecondary }]}>Reply</ThemedText>
              </TouchableOpacity>
            )}

            {hasReplies && (
              <TouchableOpacity style={styles.actionButton} onPress={handleToggleExpand}>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={Colors.primary}
                />
                <ThemedText style={[styles.actionText, styles.actionTextPrimary]}>
                  {isExpanded ? 'Hide' : `${comment.replies_count} ${comment.replies_count === 1 ? 'reply' : 'replies'}`}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>

          {showReplyInput && (
            <View style={styles.replyInputContainer}>
              <TextInput
                style={[styles.replyInput, { color: appColors.textPrimary }]}
                placeholder={`Reply to ${comment.author.full_name.split(' ')[0]}...`}
                placeholderTextColor={appColors.textSecondary}
                value={replyText}
                onChangeText={setReplyText}
                multiline
                maxLength={1000}
              />
              <View style={styles.replyActions}>
                <TouchableOpacity
                  style={styles.cancelReplyButton}
                  onPress={() => {
                    setShowReplyInput(false);
                    setReplyText('');
                  }}
                >
                  <ThemedText style={[styles.cancelReplyText, { color: appColors.textSecondary }]}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitReplyButton,
                    (!replyText.trim() || replyMutation.isPending) && [styles.submitReplyButtonDisabled, { backgroundColor: appColors.textSecondary }]
                  ]}
                  onPress={handleSubmitReply}
                  disabled={!replyText.trim() || replyMutation.isPending}
                >
                  {replyMutation.isPending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="send" size={16} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      {hasReplies && isExpanded && (
        <View style={styles.repliesContainer}>
          {comment.replies!.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              postId={postId}
              onUserPress={onUserPress}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
        </View>
      )}

      {hasReplies && isMaxDepth && (
        <TouchableOpacity style={styles.viewMoreButton}>
          <ThemedText style={styles.viewMoreText}>
            View {comment.replies_count} more {comment.replies_count === 1 ? 'reply' : 'replies'}
          </ThemedText>
          <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
});

interface CollapsedThreadProps {
  count: number;
  onExpand: () => void;
}

export function CollapsedThread({ count, onExpand }: CollapsedThreadProps) {
  const appColors = useAppColors();
  return (
    <TouchableOpacity style={styles.collapsedThread} onPress={onExpand}>
      <View style={[styles.collapsedLine, { backgroundColor: appColors.border }]} />
      <ThemedText style={styles.collapsedText}>
        {count} hidden {count === 1 ? 'reply' : 'replies'}
      </ThemedText>
      <Ionicons name="chevron-down" size={14} color={Colors.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  threadContainer: {
    marginBottom: Spacing.md,
  },
  nestedThread: {
    marginLeft: Spacing.md,
    paddingLeft: Spacing.md,
    borderLeftWidth: 2,
  },
  threadLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
  },
  commentContainer: {
    flexDirection: 'row',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: Spacing.sm,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.small,
    color: Colors.primary,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  authorName: {
    ...Typography.caption,
    fontWeight: '600',
  },
  timestamp: {
    ...Typography.small,
  },
  editedBadge: {
    ...Typography.small,
    fontStyle: 'italic',
  },
  commentText: {
    ...Typography.body,
    marginTop: Spacing.xs,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    ...Typography.small,
  },
  actionTextPrimary: {
    color: Colors.primary,
  },
  repliesContainer: {
    marginTop: Spacing.md,
  },
  replyInputContainer: {
    marginTop: Spacing.md,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  replyInput: {
    ...Typography.body,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  cancelReplyButton: {
    padding: Spacing.sm,
  },
  cancelReplyText: {
    ...Typography.caption,
  },
  submitReplyButton: {
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitReplyButtonDisabled: {
    opacity: 0.6,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingLeft: 44,
    gap: 4,
  },
  viewMoreText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  collapsedThread: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingLeft: Spacing.xl,
    gap: Spacing.sm,
  },
  collapsedLine: {
    width: 20,
    height: 2,
  },
  collapsedText: {
    ...Typography.small,
    color: Colors.primary,
  },
});
