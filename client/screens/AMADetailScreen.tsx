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
import { useAppColors } from '@/hooks/useAppColors';
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
  const appColors = useAppColors();

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
      case 'live': return appColors.error;
      case 'upcoming': return appColors.warning;
      case 'completed': return appColors.textSecondary;
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
      <View style={[styles.headerContainer, { backgroundColor: appColors.surface }]}>
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
        <View style={[styles.hostSection, { borderBottomColor: appColors.border }]}>
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
              <ThemedText style={[styles.hostName, { color: appColors.textPrimary }]}>{ama.host.full_name}</ThemedText>
              {ama.host.specialty && (
                <ThemedText style={[styles.hostSpecialty, { color: appColors.textSecondary }]}>{ama.host.specialty}</ThemedText>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* AMA Info */}
        <View style={styles.amaInfo}>
          <ThemedText style={[styles.amaTitle, { color: appColors.textPrimary }]}>{ama.title}</ThemedText>
          <ThemedText style={[styles.amaDescription, { color: appColors.textSecondary }]}>{ama.description}</ThemedText>

          {/* Meta Info */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color={appColors.textSecondary} />
              <ThemedText style={[styles.metaText, { color: appColors.textSecondary }]}>
                {formatDate(ama.scheduled_at)}
              </ThemedText>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="help-circle-outline" size={16} color={appColors.textSecondary} />
              <ThemedText style={[styles.metaText, { color: appColors.textSecondary }]}>
                {ama.questions_count} questions
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Questions Header */}
        <View style={[styles.questionsHeader, { borderTopColor: appColors.border }]}>
          <ThemedText style={[styles.questionsTitle, { color: appColors.textPrimary }]}>Questions</ThemedText>
          <ThemedText style={[styles.questionsSubtitle, { color: appColors.textSecondary }]}>
            Upvote questions you want answered
          </ThemedText>
        </View>
      </View>
    );
  };

  const renderQuestion = ({ item }: { item: Question }) => (
    <View style={[styles.questionCard, { backgroundColor: appColors.surface }]}>
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
          <ThemedText style={[styles.questionAuthorName, { color: appColors.textPrimary }]}>{item.author.full_name}</ThemedText>
          <ThemedText style={[styles.questionTime, { color: appColors.textSecondary }]}>{formatRelativeTime(item.created_at)}</ThemedText>
        </View>
      </TouchableOpacity>

      <ThemedText style={[styles.questionContent, { color: appColors.textPrimary }]}>{item.content}</ThemedText>

      {item.answer && (
        <View style={styles.answerContainer}>
          <View style={styles.answerBadge}>
            <MaterialCommunityIcons name="check-circle" size={14} color={Colors.secondary} />
            <ThemedText style={styles.answerBadgeText}>Answered</ThemedText>
          </View>
          <ThemedText style={[styles.answerText, { color: appColors.textPrimary }]}>{item.answer}</ThemedText>
        </View>
      )}

      <View style={[styles.questionActions, { borderTopColor: appColors.border }]}>
        <TouchableOpacity style={styles.upvoteButton}>
          <Ionicons
            name={item.user_voted ? 'arrow-up' : 'arrow-up-outline'}
            size={20}
            color={item.user_voted ? Colors.primary : appColors.textSecondary}
          />
          <ThemedText style={[
            styles.upvoteCount,
            { color: appColors.textSecondary },
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
      <Ionicons name="help-circle-outline" size={48} color={appColors.textSecondary} />
      <ThemedText style={[styles.emptyTitle, { color: appColors.textPrimary }]}>No questions yet</ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: appColors.textSecondary }]}>
        Be the first to ask a question!
      </ThemedText>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: appColors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const isLive = ama?.status === 'live';
  const isUpcoming = ama?.status === 'upcoming';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.navHeader, { backgroundColor: appColors.surface, borderBottomColor: appColors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={appColors.textPrimary} />
          </TouchableOpacity>
          <ThemedText style={[styles.navTitle, { color: appColors.textPrimary }]}>AMA Session</ThemedText>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color={appColors.textPrimary} />
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
          <View style={[styles.inputContainer, { backgroundColor: appColors.surface, borderTopColor: appColors.border }]}>
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: appColors.textPrimary }]}
              placeholder="Ask a question..."
              placeholderTextColor={appColors.textSecondary}
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
                  color={questionText.trim() ? Colors.primary : appColors.textSecondary}
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
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.sm,
  },
  navTitle: {
    ...Typography.heading,
  },
  shareButton: {
    padding: Spacing.sm,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  headerContainer: {
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
  },
  hostSpecialty: {
    ...Typography.caption,
    marginTop: 2,
  },
  amaInfo: {
    padding: Spacing.lg,
  },
  amaTitle: {
    ...Typography.title,
    marginBottom: Spacing.sm,
  },
  amaDescription: {
    ...Typography.body,
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
  },
  questionsHeader: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  questionsTitle: {
    ...Typography.heading,
  },
  questionsSubtitle: {
    ...Typography.caption,
    marginTop: 2,
  },
  questionCard: {
    padding: Spacing.lg,
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
  },
  questionTime: {
    ...Typography.small,
  },
  questionContent: {
    ...Typography.body,
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
    lineHeight: 22,
  },
  questionActions: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  upvoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  upvoteCount: {
    ...Typography.caption,
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
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    ...Typography.body,
    marginTop: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
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
