/**
 * PostDetail Screen
 * View full post with comments thread
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { postsApi } from '@/lib/api';
import { Post, Comment } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { formatRelativeTime } from '@/lib/utils';
import PostCard from '@/components/PostCard';
import RichTextContent from '@/components/RichTextContent';

type PostDetailRouteParams = {
  PostDetail: {
    postId: number;
  };
};

export default function PostDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<PostDetailRouteParams, 'PostDetail'>>();
  const { postId } = route.params;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const inputRef = useRef<TextInput>(null);

  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  // Fetch post
  const {
    data: post,
    isLoading: postLoading,
    refetch: refetchPost,
  } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const response = await postsApi.getPost(postId);
      return response.data;
    },
  });

  // Fetch comments
  const {
    data: commentsData,
    isLoading: commentsLoading,
    isRefetching,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const response = await postsApi.getComments(postId);
      return response.data?.comments || [];
    },
  });

  const comments = commentsData || [];

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async () => {
      const response = await postsApi.addComment(
        postId,
        commentText.trim(),
        replyingTo?.id
      );
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to add comment');
      }
      return response.data;
    },
    onSuccess: () => {
      setCommentText('');
      setReplyingTo(null);
      refetchComments();
      refetchPost();
    },
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ direction }: { direction: 'up' | 'down' }) => {
      return postsApi.vote(postId, direction);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (post?.is_bookmarked) {
        return postsApi.removeBookmark(postId);
      }
      return postsApi.bookmark(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });

  const handleRefresh = useCallback(() => {
    refetchPost();
    refetchComments();
  }, [refetchPost, refetchComments]);

  const handleReply = useCallback((comment: Comment) => {
    setReplyingTo(comment);
    inputRef.current?.focus();
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleSubmitComment = useCallback(() => {
    if (!commentText.trim()) return;
    addCommentMutation.mutate();
  }, [commentText, addCommentMutation]);

  const handleUserPress = useCallback((userId: number) => {
    navigation.navigate('UserProfile', { userId });
  }, [navigation]);

  const handleHashtagPress = useCallback((tag: string) => {
    navigation.navigate('Hashtag', { tag });
  }, [navigation]);

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={[styles.commentItem, item.parent_id != null && styles.replyItem]}>
      <TouchableOpacity onPress={() => handleUserPress(Number(item.author.id))}>
        {item.author.avatar_url ? (
          <Image source={{ uri: item.author.avatar_url }} style={styles.commentAvatar} />
        ) : (
          <View style={[styles.commentAvatar, styles.commentAvatarPlaceholder]}>
            <ThemedText style={styles.commentAvatarText}>
              {(item.author.first_name || 'U')[0]}{(item.author.last_name || '')[0]}
            </ThemedText>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <TouchableOpacity onPress={() => handleUserPress(Number(item.author.id))}>
            <ThemedText style={styles.commentAuthor}>{item.author.full_name}</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.commentTime}>
            {formatRelativeTime(item.created_at)}
          </ThemedText>
        </View>

        <RichTextContent
          content={item.content}
          onMentionPress={handleUserPress}
          onHashtagPress={handleHashtagPress}
          style={styles.commentText}
        />

        <View style={styles.commentActions}>
          <TouchableOpacity style={styles.commentAction}>
            <Ionicons
              name={item.user_vote === 'up' ? 'arrow-up' : 'arrow-up-outline'}
              size={16}
              color={item.user_vote === 'up' ? Colors.secondary : Colors.textSecondary}
            />
            <ThemedText style={styles.commentActionText}>
              {item.upvotes - item.downvotes}
            </ThemedText>
            <Ionicons
              name={item.user_vote === 'down' ? 'arrow-down' : 'arrow-down-outline'}
              size={16}
              color={item.user_vote === 'down' ? Colors.error : Colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.commentAction}
            onPress={() => handleReply(item)}
          >
            <Ionicons name="chatbubble-outline" size={14} color={Colors.textSecondary} />
            <ThemedText style={styles.commentActionText}>Reply</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Nested replies */}
        {item.replies && item.replies.length > 0 ? (
          <View style={styles.repliesContainer}>
            {item.replies.map((reply) => (
              <View key={reply.id} style={styles.replyItem}>
                <TouchableOpacity onPress={() => handleUserPress(Number(reply.author.id))}>
                  {reply.author.avatar_url ? (
                    <Image source={{ uri: reply.author.avatar_url }} style={styles.replyAvatar} />
                  ) : (
                    <View style={[styles.replyAvatar, styles.commentAvatarPlaceholder]}>
                      <ThemedText style={styles.replyAvatarText}>
                        {(reply.author.first_name || 'U')[0]}{(reply.author.last_name || '')[0]}
                      </ThemedText>
                    </View>
                  )}
                </TouchableOpacity>
                <View style={styles.replyContent}>
                  <ThemedText style={styles.replyAuthor}>{reply.author.full_name}</ThemedText>
                  <ThemedText style={styles.replyText}>{reply.content}</ThemedText>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );

  const renderHeader = () => {
    if (!post) return null;

    return (
      <View style={styles.postContainer}>
        <PostCard
          post={post}
          onPress={() => {}}
          onUserPress={() => handleUserPress(post.author.id)}
          onVote={(direction) => direction && voteMutation.mutate({ direction })}
          onBookmark={() => bookmarkMutation.mutate()}
          onHashtagPress={handleHashtagPress}
          onMentionPress={handleUserPress}
          showFullContent
        />
        <View style={styles.commentsHeader}>
          <ThemedText style={styles.commentsTitle}>
            Comments ({post.comments_count})
          </ThemedText>
        </View>
      </View>
    );
  };

  if (postLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Post</ThemedText>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Comments List */}
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderHeader}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Comment Input */}
        <View style={styles.inputContainer}>
          {replyingTo && (
            <View style={styles.replyingToBar}>
              <ThemedText style={styles.replyingToText}>
                Replying to {replyingTo.author.full_name}
              </ThemedText>
              <TouchableOpacity onPress={handleCancelReply}>
                <Ionicons name="close" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.inputAvatar} />
            ) : (
              <View style={[styles.inputAvatar, styles.commentAvatarPlaceholder]}>
                <ThemedText style={styles.commentAvatarText}>
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </ThemedText>
              </View>
            )}
            <View style={styles.inputWrapper}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder={replyingTo ? 'Write a reply...' : 'Add a comment...'}
                placeholderTextColor={Colors.textSecondary}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={1000}
              />
            </View>
            <TouchableOpacity
              style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
              onPress={handleSubmitComment}
              disabled={!commentText.trim() || addCommentMutation.isPending}
            >
              {addCommentMutation.isPending ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={commentText.trim() ? Colors.primary : Colors.textSecondary}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
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
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.heading,
    color: Colors.textPrimary,
  },
  moreButton: {
    padding: Spacing.sm,
  },
  listContent: {
    paddingBottom: Spacing.lg,
  },
  postContainer: {
    backgroundColor: Colors.surface,
  },
  commentsHeader: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  commentsTitle: {
    ...Typography.heading,
    color: Colors.textPrimary,
  },
  commentItem: {
    flexDirection: 'row',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  replyItem: {
    paddingLeft: Spacing.xl,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: Spacing.md,
  },
  commentAvatarPlaceholder: {
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  commentAuthor: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  commentTime: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  commentText: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.lg,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  commentActionText: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  repliesContainer: {
    marginTop: Spacing.md,
    paddingLeft: Spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: Colors.border,
  },
  replyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: Spacing.sm,
  },
  replyAvatarText: {
    fontSize: 9,
    color: Colors.primary,
    fontWeight: '600',
  },
  replyContent: {
    flex: 1,
  },
  replyAuthor: {
    ...Typography.small,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  replyText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  inputContainer: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  replyingToBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary + '10',
  },
  replyingToText: {
    ...Typography.small,
    color: Colors.primary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxHeight: 100,
  },
  input: {
    ...Typography.body,
    color: Colors.textPrimary,
    maxHeight: 80,
  },
  sendButton: {
    padding: Spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
