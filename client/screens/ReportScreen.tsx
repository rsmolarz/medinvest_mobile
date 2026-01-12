/**
 * Report Screen
 * Report users, posts, comments, or messages
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useThemeContext } from '@/contexts/ThemeContext';
import { haptics } from '@/lib/haptics';
import { api } from '@/lib/api';

// Report types
export type ReportType = 'user' | 'post' | 'comment' | 'message';

export interface ReportParams {
  type: ReportType;
  targetId: number;
  targetName?: string; // For display purposes
}

// Report reasons by type
const REPORT_REASONS = {
  user: [
    { id: 'spam', label: 'Spam or fake account', icon: 'warning-outline' },
    { id: 'harassment', label: 'Harassment or bullying', icon: 'alert-circle-outline' },
    { id: 'impersonation', label: 'Impersonation', icon: 'person-outline' },
    { id: 'inappropriate', label: 'Inappropriate content', icon: 'eye-off-outline' },
    { id: 'scam', label: 'Scam or fraud', icon: 'shield-outline' },
    { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
  ],
  post: [
    { id: 'spam', label: 'Spam', icon: 'warning-outline' },
    { id: 'harassment', label: 'Harassment or hate speech', icon: 'alert-circle-outline' },
    { id: 'misinformation', label: 'False information', icon: 'information-circle-outline' },
    { id: 'violence', label: 'Violence or dangerous content', icon: 'skull-outline' },
    { id: 'inappropriate', label: 'Nudity or sexual content', icon: 'eye-off-outline' },
    { id: 'copyright', label: 'Copyright violation', icon: 'document-outline' },
    { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
  ],
  comment: [
    { id: 'spam', label: 'Spam', icon: 'warning-outline' },
    { id: 'harassment', label: 'Harassment or hate speech', icon: 'alert-circle-outline' },
    { id: 'misinformation', label: 'False information', icon: 'information-circle-outline' },
    { id: 'inappropriate', label: 'Inappropriate content', icon: 'eye-off-outline' },
    { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
  ],
  message: [
    { id: 'spam', label: 'Spam', icon: 'warning-outline' },
    { id: 'harassment', label: 'Harassment or threatening', icon: 'alert-circle-outline' },
    { id: 'scam', label: 'Scam or fraud', icon: 'shield-outline' },
    { id: 'inappropriate', label: 'Inappropriate content', icon: 'eye-off-outline' },
    { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
  ],
};

const TYPE_TITLES: Record<ReportType, string> = {
  user: 'Report User',
  post: 'Report Post',
  comment: 'Report Comment',
  message: 'Report Message',
};

type ReportScreenRouteProp = RouteProp<{ Report: ReportParams }, 'Report'>;

export default function ReportScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<ReportScreenRouteProp>();
  const { colors } = useThemeContext();
  
  const { type, targetId, targetName } = route.params;
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [step, setStep] = useState<'reason' | 'details' | 'submitted'>('reason');

  const reasons = REPORT_REASONS[type];

  // Submit report mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      return api.post('/reports', {
        type,
        target_id: targetId,
        reason: selectedReason,
        details: additionalDetails.trim() || undefined,
      });
    },
    onSuccess: () => {
      haptics.success();
      setStep('submitted');
    },
    onError: (error) => {
      haptics.error();
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    },
  });

  const handleSelectReason = useCallback((reasonId: string) => {
    haptics.selection();
    setSelectedReason(reasonId);
  }, []);

  const handleContinue = useCallback(() => {
    if (!selectedReason) return;
    haptics.buttonPress();
    setStep('details');
  }, [selectedReason]);

  const handleSubmit = useCallback(() => {
    if (!selectedReason) return;
    haptics.buttonPress();
    submitMutation.mutate();
  }, [selectedReason, submitMutation]);

  const handleDone = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Render reason selection step
  const renderReasonStep = () => (
    <>
      <View style={styles.stepHeader}>
        <ThemedText style={[styles.stepTitle, { color: colors.textPrimary }]}>
          Why are you reporting this {type}?
        </ThemedText>
        <ThemedText style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
          Select the reason that best describes the issue
        </ThemedText>
      </View>

      <View style={[styles.reasonsContainer, { backgroundColor: colors.surface }]}>
        {reasons.map((reason, index) => (
          <TouchableOpacity
            key={reason.id}
            style={[
              styles.reasonItem,
              index < reasons.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              selectedReason === reason.id && { backgroundColor: colors.primary + '10' },
            ]}
            onPress={() => handleSelectReason(reason.id)}
          >
            <Ionicons 
              name={reason.icon as any} 
              size={22} 
              color={selectedReason === reason.id ? colors.primary : colors.textSecondary} 
            />
            <ThemedText 
              style={[
                styles.reasonLabel, 
                { color: selectedReason === reason.id ? colors.primary : colors.textPrimary }
              ]}
            >
              {reason.label}
            </ThemedText>
            {selectedReason === reason.id && (
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: selectedReason ? colors.primary : colors.border },
          ]}
          onPress={handleContinue}
          disabled={!selectedReason}
        >
          <ThemedText style={[styles.continueButtonText, { color: selectedReason ? 'white' : colors.textSecondary }]}>
            Continue
          </ThemedText>
        </TouchableOpacity>
      </View>
    </>
  );

  // Render details step
  const renderDetailsStep = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.detailsContainer}
    >
      <View style={styles.stepHeader}>
        <ThemedText style={[styles.stepTitle, { color: colors.textPrimary }]}>
          Add more details (optional)
        </ThemedText>
        <ThemedText style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
          Provide any additional information that might help us review this report
        </ThemedText>
      </View>

      <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          style={[styles.detailsInput, { color: colors.textPrimary }]}
          placeholder="Describe the issue in more detail..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={6}
          maxLength={1000}
          value={additionalDetails}
          onChangeText={setAdditionalDetails}
          textAlignVertical="top"
        />
        <ThemedText style={[styles.charCount, { color: colors.textSecondary }]}>
          {additionalDetails.length}/1000
        </ThemedText>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
        <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
          Your report is confidential. The reported user won't know who submitted this report.
        </ThemedText>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.backButton, { borderColor: colors.border }]}
          onPress={() => setStep('reason')}
        >
          <ThemedText style={[styles.backButtonText, { color: colors.textPrimary }]}>
            Back
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={submitMutation.isPending}
        >
          {submitMutation.isPending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <ThemedText style={styles.submitButtonText}>Submit Report</ThemedText>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  // Render submitted confirmation
  const renderSubmittedStep = () => (
    <View style={styles.submittedContainer}>
      <View style={[styles.successIcon, { backgroundColor: colors.success + '20' }]}>
        <Ionicons name="checkmark-circle" size={64} color={colors.success} />
      </View>
      
      <ThemedText style={[styles.successTitle, { color: colors.textPrimary }]}>
        Report Submitted
      </ThemedText>
      
      <ThemedText style={[styles.successMessage, { color: colors.textSecondary }]}>
        Thank you for helping keep MedInvest safe. Our team will review this report and take appropriate action.
      </ThemedText>

      <View style={[styles.nextStepsContainer, { backgroundColor: colors.surface }]}>
        <ThemedText style={[styles.nextStepsTitle, { color: colors.textPrimary }]}>
          What happens next?
        </ThemedText>
        <View style={styles.nextStepItem}>
          <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
            <ThemedText style={styles.stepNumberText}>1</ThemedText>
          </View>
          <ThemedText style={[styles.nextStepText, { color: colors.textSecondary }]}>
            Our team reviews the report within 24-48 hours
          </ThemedText>
        </View>
        <View style={styles.nextStepItem}>
          <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
            <ThemedText style={styles.stepNumberText}>2</ThemedText>
          </View>
          <ThemedText style={[styles.nextStepText, { color: colors.textSecondary }]}>
            If the content violates our guidelines, action will be taken
          </ThemedText>
        </View>
        <View style={styles.nextStepItem}>
          <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
            <ThemedText style={styles.stepNumberText}>3</ThemedText>
          </View>
          <ThemedText style={[styles.nextStepText, { color: colors.textSecondary }]}>
            You may receive a notification about the outcome
          </ThemedText>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: colors.primary }]}
        onPress={handleDone}
      >
        <ThemedText style={styles.doneButtonText}>Done</ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {TYPE_TITLES[type]}
        </ThemedText>
        <View style={styles.headerRight} />
      </View>

      {/* Target info */}
      {targetName && step !== 'submitted' && (
        <View style={[styles.targetInfo, { backgroundColor: colors.backgroundSecondary }]}>
          <Ionicons 
            name={type === 'user' ? 'person-circle-outline' : 'document-text-outline'} 
            size={20} 
            color={colors.textSecondary} 
          />
          <ThemedText style={[styles.targetName, { color: colors.textPrimary }]} numberOfLines={1}>
            {targetName}
          </ThemedText>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {step === 'reason' && renderReasonStep()}
        {step === 'details' && renderDetailsStep()}
        {step === 'submitted' && renderSubmittedStep()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.heading,
  },
  headerRight: {
    width: 40,
  },
  targetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  targetName: {
    ...Typography.body,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  stepHeader: {
    padding: Spacing.lg,
  },
  stepTitle: {
    ...Typography.title,
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    ...Typography.body,
    lineHeight: 22,
  },
  reasonsContainer: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.card,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  reasonLabel: {
    ...Typography.body,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  continueButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  continueButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
  detailsContainer: {
    flex: 1,
  },
  inputContainer: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.card,
  },
  detailsInput: {
    ...Typography.body,
    minHeight: 150,
  },
  charCount: {
    ...Typography.small,
    textAlign: 'right',
    marginTop: Spacing.sm,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  infoText: {
    ...Typography.small,
    flex: 1,
    lineHeight: 18,
  },
  backButton: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  backButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  submitButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: 'white',
  },
  submittedContainer: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.xl,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  successTitle: {
    ...Typography.title,
    marginTop: Spacing.lg,
  },
  successMessage: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  nextStepsContainer: {
    width: '100%',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginTop: Spacing.xl,
    ...Shadows.card,
  },
  nextStepsTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    ...Typography.small,
    color: 'white',
    fontWeight: '700',
  },
  nextStepText: {
    ...Typography.body,
    flex: 1,
    lineHeight: 22,
  },
  doneButton: {
    width: '100%',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  doneButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: 'white',
  },
});
