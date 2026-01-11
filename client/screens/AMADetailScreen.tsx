/**
 * AMADetail Screen
 * View and participate in AMA sessions
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { contentApi } from '@/lib/api';
import { AMA } from '@/types';
import { formatRelativeTime, formatDate } from '@/lib/utils';

type AMADetailRouteParams = {
  AMADetail: {
    amaId: number;
  };
};

interface Question {
  id: number;
  content: string;
  author: {
    id: number;
    full_name: string;
    avatar_url?: string;
  };
  upvotes: number;
  user_voted: boolean;
  answer?: string;
  answered_at?: string;
  created_at: string;
}

export default function AMADetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AMADetailRouteParams, 'AMADetail'>>();
  const { amaId } = route.params;
  const queryClient = useQueryClient();
  const inputRef = useRef<TextInput>(null);

  const [questionText, setQuestionText] = useState('');

  // Fetch AMA details
  const {
    data: ama,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['ama', amaId],
    queryFn: async () => {
      const response = await contentApi.getAMA(amaId);
      return response.data;
    },
  });

  // Submit question mutation
  const askQuestionMutation = useMutation({
    mutationFn: async () => {
      const response = await contentApi.askQuestion(amaId, questionText.trim());
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to submit question');
      }
      return response.data;
    },
    onSuccess: () => {
      setQuestionText('');
      refetch();
    },
  });

  const handleSubmitQuestion = useCallback(() => {
    if (!questionText.trim()) return;
    askQuestionMutation.mutate();
  }, [questionText, askQuestionMutation]);

  const handleUserPress = useCallback((userId: number) => {
    navigation.navigate('UserProfile', { userId });
  }, [navigation]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return Colors.error;
      case 'upcoming': return Colors.warning;
      case 'completed': return Colors.textSecondary;
      default: return Colors.primary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live': return '🔴 LIVE NOW';
      case 'upcoming': return '📅 Upcoming';
      case 'completed': return '✓ Completed';
      default: return status;
    }
  };

  const renderHeader = () => {
    if (!ama) return null;

    return (
      <View style={styles.headerContainer}>
        {/* Hero */}
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={styles.statusBadge}>
            <ThemedText style={styles.statusText}>{getStatusText(ama.status)}</ThemedText>
          </View>
        </LinearGradient>

        {/* Host Info */}
        <View style={styles.hostSection}>
          <TouchableOpacity
            style={styles.hostInfo}
            onPress={() => handleUserPress(ama.host.id)}
          >
            {ama.host.avatar_url ? (
              <Image source={{ uri: ama.host.avatar_url }} style={styles.hostAvatar} />
            ) : (
              <View style={[styles.hostAvatar, styles.hostAvatarPlaceholder]}>
                <ThemedText style={styles.hostAvatarText}>
                  {ama.host.first_name[0]}{ama.host.last_name[0]}
                </ThemedText>
              </View>
            )}
            <View style={styles.hostDetails}>
              <ThemedText style={styles.hostName}>{ama.host.full_name}</ThemedText>
              {ama.host.specialty && (
                <ThemedText style={styles.hostSpecialty}>{ama.host.specialty}</ThemedText>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* AMA Info */}
        <View style={styles.amaInfo}>
          <ThemedText style={styles.amaTitle}>{ama.title}</ThemedText>
          <ThemedText style={styles.amaDescription}>{ama.description}</ThemedText>

          {/* Meta Info */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
              <ThemedText style={styles.metaText}>
                {formatDate(ama.scheduled_at)}
              </ThemedText>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="help-circle-outline" size={16} color={Colors.textSecondary} />
              <ThemedText style={styles.metaText}>
                {ama.questions_count} questions
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Questions Header */}
        <View style={styles.questionsHeader}>
          <ThemedText style={styles.questionsTitle}>Questions</ThemedText>
          <ThemedText style={styles.questionsSubtitle}>
            Upvote questions you want answered
          </ThemedText>
        </View>
      </View>
    );
  };

  const renderQuestion = ({ item }: { item: Question }) => (
    <View style={styles.questionCard}>
      <TouchableOpacity
        style={styles.questionAuthor}
        onPress={() => handleUserPress(item.author.id)}
      >
        {item.author.avatar_url ? (
          <Image source={{ uri: item.author.avatar_url }} style={styles.questionAvatar} />
        ) : (
          <View style={[styles.questionAvatar, styles.questionAvatarPlaceholder]}>
            <ThemedText style={styles.questionAvatarText}>
              {item.author.full_name[0]}
            </ThemedText>
          </View>
        )}
        <View>
          <ThemedText style={styles.questionAuthorName}>{item.author.full_name}</ThemedText>
          <ThemedText style={styles.questionTime}>{formatRelativeTime(item.created_at)}</ThemedText>
        </View>
      </TouchableOpacity>

      <ThemedText style={styles.questionContent}>{item.content}</ThemedText>

      {item.answer && (
        <View style={styles.answerContainer}>
          <View style={styles.answerBadge}>
            <MaterialCommunityIcons name="check-circle" size={14} color={Colors.secondary} />
            <ThemedText style={styles.answerBadgeText}>Answered</ThemedText>
          </View>
          <ThemedText style={styles.answerText}>{item.answer}</ThemedText>
        </View>
      )}

      <View style={styles.questionActions}>
        <TouchableOpacity style={styles.upvoteButton}>
          <Ionicons
            name={item.user_voted ? 'arrow-up' : 'arrow-up-outline'}
            size={20}
            color={item.user_voted ? Colors.primary : Colors.textSecondary}
          />
          <ThemedText style={[
            styles.upvoteCount,
            item.user_voted && styles.upvoteCountActive,
          ]}>
            {item.upvotes}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="help-circle-outline" size={48} color={Colors.textSecondary} />
      <ThemedText style={styles.emptyTitle}>No questions yet</ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        Be the first to ask a question!
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

  const isLive = ama?.status === 'live';
  const isUpcoming = ama?.status === 'upcoming';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.navHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <ThemedText style={styles.navTitle}>AMA Session</ThemedText>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Questions List */}
        <FlatList
          data={ama?.questions || []}
          renderItem={renderQuestion}
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
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Ask Question Input */}
        {(isLive || isUpcoming) && (
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Ask a question..."
              placeholderTextColor={Colors.textSecondary}
              value={questionText}
              onChangeText={setQuestionText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, !questionText.trim() && styles.sendButtonDisabled]}
              onPress={handleSubmitQuestion}
              disabled={!questionText.trim() || askQuestionMutation.isPending}
            >
              {askQuestionMutation.isPending ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={questionText.trim() ? Colors.primary : Colors.textSecondary}
                />
              )}
            </TouchableOpacity>
          </View>
        )}
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
  navHeader: {
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
  navTitle: {
    ...Typography.heading,
    color: Colors.textPrimary,
  },
  shareButton: {
    padding: Spacing.sm,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  headerContainer: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  heroBanner: {
    height: 120,
    justifyContent: 'flex-end',
    padding: Spacing.lg,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    ...Typography.caption,
    color: 'white',
    fontWeight: '600',
  },
  hostSection: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: Spacing.md,
  },
  hostAvatarPlaceholder: {
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostAvatarText: {
    ...Typography.heading,
    color: Colors.primary,
  },
  hostDetails: {
    flex: 1,
  },
  hostName: {
    ...Typography.heading,
    color: Colors.textPrimary,
  },
  hostSpecialty: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  amaInfo: {
    padding: Spacing.lg,
  },
  amaTitle: {
    ...Typography.title,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  amaDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.xl,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  questionsHeader: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  questionsTitle: {
    ...Typography.heading,
    color: Colors.textPrimary,
  },
  questionsSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  questionCard: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  questionAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  questionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.sm,
  },
  questionAvatarPlaceholder: {
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionAvatarText: {
    ...Typography.small,
    color: Colors.primary,
    fontWeight: '600',
  },
  questionAuthorName: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  questionTime: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  questionContent: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  answerContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.secondary + '10',
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
  },
  answerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  answerBadgeText: {
    ...Typography.small,
    color: Colors.secondary,
    fontWeight: '600',
  },
  answerText: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  questionActions: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  upvoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  upvoteCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  upvoteCountActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['5xl'],
  },
  emptyTitle: {
    ...Typography.heading,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxHeight: 100,
  },
  sendButton: {
    padding: Spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
