import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { contentApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

type AMADetailRouteParams = {
  AMADetail: {
    amaId: number;
  };
};

export default function AMADetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AMADetailRouteParams, 'AMADetail'>>();
  const { amaId } = route.params;
  const appColors = useAppColors();

  const {
    data: ama,
    isLoading,
  } = useQuery({
    queryKey: ['ama', amaId],
    queryFn: async () => {
      const response = await contentApi.getAMA(amaId);
      return response.data;
    },
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'live': return 'LIVE NOW';
      case 'scheduled': return 'Upcoming';
      case 'ended': return 'Completed';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.navHeader, { backgroundColor: appColors.surface, borderBottomColor: appColors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={appColors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={[styles.navTitle, { color: appColors.textPrimary }]}>AMA Session</ThemedText>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          {ama ? (
            <View style={styles.statusBadge}>
              <ThemedText style={styles.statusText}>{getStatusLabel(ama.status)}</ThemedText>
            </View>
          ) : null}
        </LinearGradient>

        {ama ? (
          <View style={styles.contentSection}>
            <View style={[styles.expertSection, { borderBottomColor: appColors.border }]}>
              <View style={[styles.expertAvatar, { backgroundColor: Colors.primary + '20' }]}>
                <ThemedText style={{ color: Colors.primary, fontSize: 20, fontWeight: '700' }}>
                  {ama.expert?.full_name?.[0] || 'E'}
                </ThemedText>
              </View>
              <View style={styles.expertDetails}>
                <ThemedText style={[styles.expertName, { color: appColors.textPrimary }]}>
                  {ama.expert?.full_name || 'Expert'}
                </ThemedText>
                {ama.expert_bio ? (
                  <ThemedText style={[styles.expertBio, { color: appColors.textSecondary }]}>
                    {ama.expert_bio}
                  </ThemedText>
                ) : null}
              </View>
            </View>

            <View style={styles.infoSection}>
              <ThemedText style={[styles.amaTitle, { color: appColors.textPrimary }]}>{ama.title}</ThemedText>
              <ThemedText style={[styles.amaDescription, { color: appColors.textSecondary }]}>{ama.description}</ThemedText>

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

            {ama.questions && ama.questions.length > 0 ? (
              <View style={styles.questionsSection}>
                <ThemedText style={[styles.sectionTitle, { color: appColors.textPrimary }]}>Questions</ThemedText>
                {ama.questions.map((q) => (
                  <View key={q.id} style={[styles.questionCard, { backgroundColor: appColors.surface }]}>
                    <ThemedText style={[styles.questionText, { color: appColors.textPrimary }]}>{q.question}</ThemedText>
                    <View style={styles.questionMeta}>
                      <ThemedText style={[styles.questionAuthor, { color: appColors.textSecondary }]}>
                        {q.author?.full_name || 'Anonymous'}
                      </ThemedText>
                      <View style={styles.upvoteRow}>
                        <Ionicons name="arrow-up-outline" size={14} color={appColors.textSecondary} />
                        <ThemedText style={[styles.upvoteCount, { color: appColors.textSecondary }]}>{q.upvotes}</ThemedText>
                      </View>
                    </View>
                    {q.answer ? (
                      <View style={styles.answerBox}>
                        <ThemedText style={[styles.answerLabel, { color: Colors.secondary }]}>Answer</ThemedText>
                        <ThemedText style={[styles.answerText, { color: appColors.textPrimary }]}>{q.answer}</ThemedText>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyQuestions}>
                <Ionicons name="chatbubble-ellipses-outline" size={48} color={appColors.textSecondary} />
                <ThemedText style={[styles.emptyText, { color: appColors.textSecondary }]}>
                  No questions yet
                </ThemedText>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyQuestions}>
            <ThemedText style={[styles.emptyText, { color: appColors.textSecondary }]}>
              AMA session not found
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
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
    width: 40,
  },
  navTitle: {
    ...Typography.heading,
  },
  scrollContent: {
    paddingBottom: Spacing['3xl'],
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
  contentSection: {
    flex: 1,
  },
  expertSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  expertAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  expertDetails: {
    flex: 1,
  },
  expertName: {
    ...Typography.heading,
  },
  expertBio: {
    ...Typography.caption,
    marginTop: 2,
  },
  infoSection: {
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
  questionsSection: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.heading,
    marginBottom: Spacing.md,
  },
  questionCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  questionText: {
    ...Typography.body,
    lineHeight: 22,
  },
  questionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  questionAuthor: {
    ...Typography.small,
  },
  upvoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upvoteCount: {
    ...Typography.small,
  },
  answerBox: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.secondary + '10',
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
  },
  answerLabel: {
    ...Typography.small,
    fontWeight: '600',
    marginBottom: 4,
  },
  answerText: {
    ...Typography.body,
    lineHeight: 22,
  },
  emptyQuestions: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
});
