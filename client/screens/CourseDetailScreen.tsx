/**
 * CourseDetail Screen
 * View course info and lessons
 */

import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { contentApi } from '@/lib/api';
import { Course, Lesson } from '@/types';
import { formatDuration } from '@/lib/utils';

type CourseDetailRouteParams = {
  CourseDetail: {
    courseId: number;
  };
};

export default function CourseDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<CourseDetailRouteParams, 'CourseDetail'>>();
  const { courseId } = route.params;
  const queryClient = useQueryClient();

  // Fetch course details
  const {
    data: course,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const response = await contentApi.getCourse(courseId);
      return response.data;
    },
  });

  // Enroll mutation
  const enrollMutation = useMutation({
    mutationFn: async () => {
      const response = await contentApi.enrollCourse(courseId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to enroll');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });

  const handleEnroll = useCallback(() => {
    enrollMutation.mutate();
  }, [enrollMutation]);

  const handleLessonPress = useCallback((lesson: Lesson) => {
    // Navigate to lesson player/viewer
    navigation.navigate('LessonDetail', { courseId, lessonId: lesson.id });
  }, [navigation, courseId]);

  const handleInstructorPress = useCallback((userId: number) => {
    navigation.navigate('UserProfile', { userId });
  }, [navigation]);

  const renderLesson = (lesson: Lesson, index: number) => {
    const isLocked = !course?.is_enrolled && !lesson.is_preview;
    const isCompleted = lesson.is_completed;

    return (
      <TouchableOpacity
        key={lesson.id}
        style={[styles.lessonItem, isLocked && styles.lessonLocked]}
        onPress={() => !isLocked && handleLessonPress(lesson)}
        disabled={isLocked}
      >
        <View style={styles.lessonNumber}>
          {isCompleted ? (
            <Ionicons name="checkmark-circle" size={24} color={Colors.secondary} />
          ) : (
            <ThemedText style={styles.lessonNumberText}>{index + 1}</ThemedText>
          )}
        </View>
        <View style={styles.lessonContent}>
          <ThemedText style={[styles.lessonTitle, isLocked && styles.lessonTitleLocked]}>
            {lesson.title}
          </ThemedText>
          <View style={styles.lessonMeta}>
            <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
            <ThemedText style={styles.lessonDuration}>
              {formatDuration(lesson.duration_minutes)}
            </ThemedText>
            {lesson.is_preview && (
              <View style={styles.previewBadge}>
                <ThemedText style={styles.previewBadgeText}>Preview</ThemedText>
              </View>
            )}
          </View>
        </View>
        {isLocked ? (
          <Ionicons name="lock-closed" size={20} color={Colors.textSecondary} />
        ) : (
          <Ionicons name="play-circle-outline" size={24} color={Colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ThemedText>Course not found</ThemedText>
      </SafeAreaView>
    );
  }

  const totalDuration = course.lessons?.reduce((sum, l) => sum + l.duration_minutes, 0) || 0;
  const completedLessons = course.lessons?.filter(l => l.is_completed).length || 0;
  const progress = course.lessons?.length ? (completedLessons / course.lessons.length) * 100 : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Course</ThemedText>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Cover */}
        {course.cover_image ? (
          <Image source={{ uri: course.cover_image }} style={styles.coverImage} />
        ) : (
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.coverPlaceholder}
          >
            <MaterialCommunityIcons name="school" size={64} color="white" />
          </LinearGradient>
        )}

        {/* Course Info */}
        <View style={styles.courseInfo}>
          <View style={styles.categoryBadge}>
            <ThemedText style={styles.categoryText}>{course.category}</ThemedText>
          </View>
          <ThemedText style={styles.courseTitle}>{course.title}</ThemedText>
          <ThemedText style={styles.courseDescription}>{course.description}</ThemedText>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="book-outline" size={18} color={Colors.primary} />
              <ThemedText style={styles.statText}>
                {course.lessons?.length || 0} lessons
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={18} color={Colors.primary} />
              <ThemedText style={styles.statText}>
                {formatDuration(totalDuration)}
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={18} color={Colors.primary} />
              <ThemedText style={styles.statText}>
                {course.enrolled_count} enrolled
              </ThemedText>
            </View>
          </View>

          {/* Instructor */}
          <TouchableOpacity
            style={styles.instructorSection}
            onPress={() => handleInstructorPress(course.instructor.id)}
          >
            {course.instructor.avatar_url ? (
              <Image source={{ uri: course.instructor.avatar_url }} style={styles.instructorAvatar} />
            ) : (
              <View style={[styles.instructorAvatar, styles.instructorAvatarPlaceholder]}>
                <ThemedText style={styles.instructorAvatarText}>
                  {course.instructor.first_name[0]}{course.instructor.last_name[0]}
                </ThemedText>
              </View>
            )}
            <View style={styles.instructorInfo}>
              <ThemedText style={styles.instructorLabel}>Instructor</ThemedText>
              <ThemedText style={styles.instructorName}>{course.instructor.full_name}</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* Progress (if enrolled) */}
          {course.is_enrolled && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <ThemedText style={styles.progressLabel}>Your Progress</ThemedText>
                <ThemedText style={styles.progressPercent}>{Math.round(progress)}%</ThemedText>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <ThemedText style={styles.progressText}>
                {completedLessons} of {course.lessons?.length} lessons completed
              </ThemedText>
            </View>
          )}
        </View>

        {/* Lessons */}
        <View style={styles.lessonsSection}>
          <ThemedText style={styles.lessonsTitle}>Course Content</ThemedText>
          {course.lessons?.map((lesson, index) => renderLesson(lesson, index))}
        </View>

        {/* What You'll Learn */}
        {course.learning_points && course.learning_points.length > 0 && (
          <View style={styles.learningSection}>
            <ThemedText style={styles.learningSectionTitle}>What You'll Learn</ThemedText>
            {course.learning_points.map((point, index) => (
              <View key={index} style={styles.learningPoint}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.secondary} />
                <ThemedText style={styles.learningPointText}>{point}</ThemedText>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Enroll Button */}
      {!course.is_enrolled && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.enrollButton}
            onPress={handleEnroll}
            disabled={enrollMutation.isPending}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.enrollGradient}
            >
              {enrollMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons name="school" size={20} color="white" />
                  <ThemedText style={styles.enrollButtonText}>
                    {course.is_premium ? 'Enroll (Premium)' : 'Enroll Free'}
                  </ThemedText>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
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
  shareButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  coverImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseInfo: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  categoryText: {
    ...Typography.small,
    color: Colors.primary,
    fontWeight: '600',
  },
  courseTitle: {
    ...Typography.title,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  courseDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  instructorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
  },
  instructorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: Spacing.md,
  },
  instructorAvatarPlaceholder: {
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructorAvatarText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  instructorInfo: {
    flex: 1,
  },
  instructorLabel: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  instructorName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  progressSection: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.secondary + '10',
    borderRadius: BorderRadius.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  progressPercent: {
    ...Typography.caption,
    color: Colors.secondary,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 4,
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.secondary,
    borderRadius: 4,
  },
  progressText: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  lessonsSection: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    marginTop: Spacing.md,
  },
  lessonsTitle: {
    ...Typography.heading,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lessonLocked: {
    opacity: 0.6,
  },
  lessonNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  lessonNumberText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  lessonContent: {
    flex: 1,
  },
  lessonTitle: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  lessonTitleLocked: {
    color: Colors.textSecondary,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 4,
  },
  lessonDuration: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  previewBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.sm,
  },
  previewBadgeText: {
    ...Typography.small,
    color: Colors.primary,
    fontWeight: '600',
  },
  learningSection: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  learningSectionTitle: {
    ...Typography.heading,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  learningPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  learningPointText: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  enrollButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.button,
  },
  enrollGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  enrollButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '700',
  },
});
