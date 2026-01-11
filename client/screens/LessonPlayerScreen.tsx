/**
 * LessonPlayer Screen
 * Play course lesson content (video, text, quiz)
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import VideoPlayer from '@/components/VideoPlayer';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { coursesApi } from '@/lib/api';
import { formatDuration } from '@/lib/utils';

type LessonPlayerRouteParams = {
  LessonPlayer: {
    courseId: number;
    lessonId: number;
  };
};

interface Lesson {
  id: number;
  title: string;
  description?: string;
  type: 'video' | 'text' | 'quiz';
  duration?: number;
  video_url?: string;
  content?: string;
  quiz?: QuizQuestion[];
  is_completed: boolean;
  order: number;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_index: number;
}

export default function LessonPlayerScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<LessonPlayerRouteParams, 'LessonPlayer'>>();
  const { courseId, lessonId } = route.params;
  const queryClient = useQueryClient();

  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);

  // Fetch lesson
  const {
    data: lesson,
    isLoading,
  } = useQuery({
    queryKey: ['lesson', courseId, lessonId],
    queryFn: async () => {
      const response = await coursesApi.getLesson(courseId, lessonId);
      return response.data as Lesson;
    },
  });

  // Fetch course lessons for navigation
  const { data: courseLessons } = useQuery({
    queryKey: ['courseLessons', courseId],
    queryFn: async () => {
      const response = await coursesApi.getCourseLessons(courseId);
      return response.data?.lessons || [];
    },
  });

  // Complete lesson mutation
  const completeLessonMutation = useMutation({
    mutationFn: async () => {
      return coursesApi.completeLesson(courseId, lessonId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson', courseId, lessonId] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });

  // Find next/prev lessons
  const currentIndex = courseLessons?.findIndex((l: Lesson) => l.id === lessonId) ?? -1;
  const prevLesson = currentIndex > 0 ? courseLessons?.[currentIndex - 1] : null;
  const nextLesson = currentIndex < (courseLessons?.length ?? 0) - 1 
    ? courseLessons?.[currentIndex + 1] 
    : null;

  // Mark lesson complete
  const handleMarkComplete = useCallback(() => {
    if (!lesson?.is_completed) {
      completeLessonMutation.mutate();
    }
  }, [lesson, completeLessonMutation]);

  // Video completion handler
  const handleVideoEnd = useCallback(() => {
    setVideoCompleted(true);
    handleMarkComplete();
  }, [handleMarkComplete]);

  // Navigate to lesson
  const navigateToLesson = useCallback((nextLessonId: number) => {
    navigation.replace('LessonPlayer', { courseId, lessonId: nextLessonId });
  }, [navigation, courseId]);

  // Quiz handlers
  const handleSelectAnswer = useCallback((optionIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuizIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
  }, [currentQuizIndex, selectedAnswers]);

  const handleNextQuestion = useCallback(() => {
    if (lesson?.quiz && currentQuizIndex < lesson.quiz.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1);
    } else {
      setShowQuizResults(true);
      handleMarkComplete();
    }
  }, [currentQuizIndex, lesson, handleMarkComplete]);

  const handlePrevQuestion = useCallback(() => {
    if (currentQuizIndex > 0) {
      setCurrentQuizIndex(currentQuizIndex - 1);
    }
  }, [currentQuizIndex]);

  const calculateQuizScore = useCallback(() => {
    if (!lesson?.quiz) return 0;
    let correct = 0;
    lesson.quiz.forEach((q, i) => {
      if (selectedAnswers[i] === q.correct_index) {
        correct++;
      }
    });
    return Math.round((correct / lesson.quiz.length) * 100);
  }, [lesson, selectedAnswers]);

  const handleRetakeQuiz = useCallback(() => {
    setCurrentQuizIndex(0);
    setSelectedAnswers([]);
    setShowQuizResults(false);
  }, []);

  // Render video lesson
  const renderVideoLesson = () => (
    <View style={styles.videoContainer}>
      <VideoPlayer
        uri={lesson!.video_url!}
        autoPlay
        showControls
        onClose={() => navigation.goBack()}
        style={styles.videoPlayer}
      />
      
      <View style={styles.lessonInfo}>
        <ThemedText style={styles.lessonTitle}>{lesson!.title}</ThemedText>
        {lesson!.description && (
          <ThemedText style={styles.lessonDescription}>{lesson!.description}</ThemedText>
        )}
        
        {(videoCompleted || lesson!.is_completed) && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.secondary} />
            <ThemedText style={styles.completedText}>Completed</ThemedText>
          </View>
        )}
      </View>
    </View>
  );

  // Render text lesson
  const renderTextLesson = () => (
    <ScrollView style={styles.textContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.lessonInfo}>
        <ThemedText style={styles.lessonTitle}>{lesson!.title}</ThemedText>
        {lesson!.duration && (
          <ThemedText style={styles.readTime}>
            <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
            {' '}{Math.ceil(lesson!.duration / 60)} min read
          </ThemedText>
        )}
      </View>
      
      <View style={styles.textContent}>
        <ThemedText style={styles.contentText}>{lesson!.content}</ThemedText>
      </View>

      <TouchableOpacity
        style={[styles.completeButton, lesson!.is_completed && styles.completedButton]}
        onPress={handleMarkComplete}
        disabled={lesson!.is_completed}
      >
        <Ionicons 
          name={lesson!.is_completed ? 'checkmark-circle' : 'checkmark-circle-outline'} 
          size={20} 
          color={lesson!.is_completed ? Colors.secondary : 'white'} 
        />
        <ThemedText style={[
          styles.completeButtonText,
          lesson!.is_completed && styles.completedButtonText
        ]}>
          {lesson!.is_completed ? 'Completed' : 'Mark as Complete'}
        </ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );

  // Render quiz lesson
  const renderQuizLesson = () => {
    if (showQuizResults) {
      const score = calculateQuizScore();
      const passed = score >= 70;

      return (
        <View style={styles.quizResultsContainer}>
          <View style={[styles.scoreCircle, passed ? styles.passedCircle : styles.failedCircle]}>
            <ThemedText style={styles.scoreText}>{score}%</ThemedText>
          </View>
          
          <ThemedText style={styles.resultTitle}>
            {passed ? 'Congratulations!' : 'Keep Learning!'}
          </ThemedText>
          <ThemedText style={styles.resultSubtitle}>
            {passed 
              ? 'You passed the quiz and completed this lesson.' 
              : 'You need 70% to pass. Review the material and try again.'}
          </ThemedText>

          <View style={styles.resultActions}>
            {!passed && (
              <TouchableOpacity style={styles.retakeButton} onPress={handleRetakeQuiz}>
                <Ionicons name="refresh" size={20} color={Colors.primary} />
                <ThemedText style={styles.retakeButtonText}>Retake Quiz</ThemedText>
              </TouchableOpacity>
            )}
            {nextLesson && passed && (
              <TouchableOpacity 
                style={styles.nextLessonButton}
                onPress={() => navigateToLesson(nextLesson.id)}
              >
                <ThemedText style={styles.nextLessonButtonText}>Next Lesson</ThemedText>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    const currentQuestion = lesson!.quiz![currentQuizIndex];
    const totalQuestions = lesson!.quiz!.length;

    return (
      <View style={styles.quizContainer}>
        {/* Progress */}
        <View style={styles.quizProgress}>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${((currentQuizIndex + 1) / totalQuestions) * 100}%` }
              ]} 
            />
          </View>
          <ThemedText style={styles.progressText}>
            {currentQuizIndex + 1} of {totalQuestions}
          </ThemedText>
        </View>

        {/* Question */}
        <ThemedText style={styles.questionText}>{currentQuestion.question}</ThemedText>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedAnswers[currentQuizIndex] === index && styles.optionSelected,
              ]}
              onPress={() => handleSelectAnswer(index)}
            >
              <View style={[
                styles.optionRadio,
                selectedAnswers[currentQuizIndex] === index && styles.optionRadioSelected,
              ]}>
                {selectedAnswers[currentQuizIndex] === index && (
                  <View style={styles.optionRadioInner} />
                )}
              </View>
              <ThemedText style={[
                styles.optionText,
                selectedAnswers[currentQuizIndex] === index && styles.optionTextSelected,
              ]}>
                {option}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Navigation */}
        <View style={styles.quizNavigation}>
          <TouchableOpacity
            style={[styles.quizNavButton, currentQuizIndex === 0 && styles.quizNavButtonDisabled]}
            onPress={handlePrevQuestion}
            disabled={currentQuizIndex === 0}
          >
            <Ionicons name="chevron-back" size={20} color={currentQuizIndex === 0 ? Colors.textSecondary : Colors.primary} />
            <ThemedText style={[styles.quizNavText, currentQuizIndex === 0 && styles.quizNavTextDisabled]}>
              Previous
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quizNavButton,
              styles.quizNextButton,
              selectedAnswers[currentQuizIndex] === undefined && styles.quizNavButtonDisabled,
            ]}
            onPress={handleNextQuestion}
            disabled={selectedAnswers[currentQuizIndex] === undefined}
          >
            <ThemedText style={styles.quizNextText}>
              {currentQuizIndex === totalQuestions - 1 ? 'Submit' : 'Next'}
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!lesson) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ThemedText>Lesson not found</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <ThemedText style={styles.headerTitle} numberOfLines={1}>
            {lesson.title}
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Lesson {currentIndex + 1} of {courseLessons?.length || 0}
          </ThemedText>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.navigate('CourseDetail', { courseId })}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {lesson.type === 'video' && renderVideoLesson()}
        {lesson.type === 'text' && renderTextLesson()}
        {lesson.type === 'quiz' && renderQuizLesson()}
      </View>

      {/* Bottom Navigation */}
      {lesson.type !== 'quiz' && (
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={[styles.navButton, !prevLesson && styles.navButtonDisabled]}
            onPress={() => prevLesson && navigateToLesson(prevLesson.id)}
            disabled={!prevLesson}
          >
            <Ionicons name="chevron-back" size={20} color={prevLesson ? Colors.textPrimary : Colors.textSecondary} />
            <ThemedText style={[styles.navButtonText, !prevLesson && styles.navButtonTextDisabled]}>
              Previous
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, styles.navButtonNext, !nextLesson && styles.navButtonDisabled]}
            onPress={() => nextLesson && navigateToLesson(nextLesson.id)}
            disabled={!nextLesson}
          >
            <ThemedText style={[styles.navButtonText, styles.navButtonTextNext, !nextLesson && styles.navButtonTextDisabled]}>
              Next
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color={nextLesson ? 'white' : Colors.textSecondary} />
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  headerTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  // Video styles
  videoContainer: {
    flex: 1,
  },
  videoPlayer: {
    width: '100%',
  },
  lessonInfo: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  lessonTitle: {
    ...Typography.title,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  lessonDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  completedText: {
    ...Typography.caption,
    color: Colors.secondary,
    fontWeight: '600',
  },
  // Text styles
  textContainer: {
    flex: 1,
  },
  readTime: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  textContent: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  contentText: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  completedButton: {
    backgroundColor: Colors.secondary + '20',
  },
  completeButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
  completedButtonText: {
    color: Colors.secondary,
  },
  // Quiz styles
  quizContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  quizProgress: {
    marginBottom: Spacing.xl,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 3,
    marginBottom: Spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    ...Typography.small,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  questionText: {
    ...Typography.title,
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },
  optionsContainer: {
    gap: Spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  optionRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRadioSelected: {
    borderColor: Colors.primary,
  },
  optionRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  optionText: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  quizNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: Spacing.xl,
  },
  quizNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  quizNavButtonDisabled: {
    opacity: 0.5,
  },
  quizNavText: {
    ...Typography.body,
    color: Colors.primary,
  },
  quizNavTextDisabled: {
    color: Colors.textSecondary,
  },
  quizNextButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
  },
  quizNextText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
  // Quiz results
  quizResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  passedCircle: {
    backgroundColor: Colors.secondary + '20',
  },
  failedCircle: {
    backgroundColor: Colors.error + '20',
  },
  scoreText: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  resultTitle: {
    ...Typography.title,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  resultSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  resultActions: {
    gap: Spacing.md,
    width: '100%',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '15',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  retakeButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  nextLessonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  nextLessonButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
  // Bottom nav
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  navButtonNext: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  navButtonTextNext: {
    color: 'white',
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: Colors.textSecondary,
  },
});
