/**
 * Report Modal
 * Report posts, comments, or users
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { moderationApi } from '@/lib/api';

export type ReportType = 'post' | 'comment' | 'user' | 'message';

interface ReportReason {
  id: string;
  label: string;
  description: string;
}

const REPORT_REASONS: ReportReason[] = [
  { id: 'spam', label: 'Spam', description: 'Misleading or repetitive content' },
  { id: 'harassment', label: 'Harassment', description: 'Bullying or threatening behavior' },
  { id: 'hate_speech', label: 'Hate Speech', description: 'Discrimination or slurs' },
  { id: 'misinformation', label: 'Misinformation', description: 'False medical or investment claims' },
  { id: 'inappropriate', label: 'Inappropriate Content', description: 'Explicit or offensive material' },
  { id: 'impersonation', label: 'Impersonation', description: 'Pretending to be someone else' },
  { id: 'other', label: 'Other', description: 'Report for another reason' },
];

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  type: ReportType;
  targetId: number;
  targetName?: string;
}

export default function ReportModal({
  visible,
  onClose,
  type,
  targetId,
  targetName,
}: ReportModalProps) {
  const appColors = useAppColors();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');

  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!selectedReason) throw new Error('Please select a reason');

      const response = await moderationApi.report({
        type,
        targetId,
        reason: selectedReason,
        details: additionalInfo.trim() || undefined,
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to submit report');
      }

      return response.data;
    },
    onSuccess: () => {
      Alert.alert(
        'Report Submitted',
        'Thank you for helping keep our community safe. We\'ll review this report and take appropriate action.',
        [{ text: 'OK', onPress: handleClose }]
      );
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleClose = () => {
    setSelectedReason(null);
    setAdditionalInfo('');
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for your report');
      return;
    }
    reportMutation.mutate();
  };

  const getTitle = () => {
    switch (type) {
      case 'post': return 'Report Post';
      case 'comment': return 'Report Comment';
      case 'user': return 'Report User';
      case 'message': return 'Report Message';
      default: return 'Report';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: appColors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: appColors.border }]}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={appColors.textPrimary} />
            </TouchableOpacity>
            <ThemedText style={[styles.title, { color: appColors.textPrimary }]}>{getTitle()}</ThemedText>
            <View style={styles.closeButton} />
          </View>

          {/* Target Info */}
          {targetName && (
            <View style={styles.targetInfo}>
              <Ionicons name="flag-outline" size={16} color={appColors.textSecondary} />
              <ThemedText style={[styles.targetText, { color: appColors.textSecondary }]}>
                Reporting: {targetName}
              </ThemedText>
            </View>
          )}

          {/* Reason Selection */}
          <View style={styles.reasonsContainer}>
            <ThemedText style={[styles.sectionTitle, { color: appColors.textSecondary }]}>
              What's the issue?
            </ThemedText>
            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.reasonItem,
                  { borderColor: appColors.border },
                  selectedReason === reason.id && styles.reasonItemSelected,
                ]}
                onPress={() => setSelectedReason(reason.id)}
              >
                <View style={styles.reasonContent}>
                  <ThemedText style={[
                    styles.reasonLabel,
                    { color: appColors.textPrimary },
                    selectedReason === reason.id && styles.reasonLabelSelected,
                  ]}>
                    {reason.label}
                  </ThemedText>
                  <ThemedText style={[styles.reasonDescription, { color: appColors.textSecondary }]}>
                    {reason.description}
                  </ThemedText>
                </View>
                <View style={[
                  styles.radioButton,
                  { borderColor: appColors.border },
                  selectedReason === reason.id && styles.radioButtonSelected,
                ]}>
                  {selectedReason === reason.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Additional Info */}
          {selectedReason && (
            <View style={styles.additionalInfoContainer}>
              <ThemedText style={[styles.sectionTitle, { color: appColors.textSecondary }]}>
                Additional details (optional)
              </ThemedText>
              <TextInput
                style={[styles.textInput, { color: appColors.textPrimary, borderColor: appColors.border }]}
                placeholder="Provide more context about this report..."
                placeholderTextColor={appColors.textSecondary}
                value={additionalInfo}
                onChangeText={setAdditionalInfo}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <ThemedText style={[styles.charCount, { color: appColors.textSecondary }]}>
                {additionalInfo.length}/500
              </ThemedText>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: appColors.error },
              !selectedReason && [styles.submitButtonDisabled, { backgroundColor: appColors.textSecondary }],
            ]}
            onPress={handleSubmit}
            disabled={!selectedReason || reportMutation.isPending}
          >
            {reportMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <ThemedText style={styles.submitButtonText}>Submit Report</ThemedText>
            )}
          </TouchableOpacity>

          {/* Disclaimer */}
          <ThemedText style={[styles.disclaimer, { color: appColors.textSecondary }]}>
            False reports may result in action against your account. Please only report genuine violations.
          </ThemedText>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Spacing.xl,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.heading,
  },
  targetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.backgroundSecondary,
    gap: Spacing.sm,
  },
  targetText: {
    ...Typography.caption,
  },
  reasonsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  reasonItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  reasonContent: {
    flex: 1,
  },
  reasonLabel: {
    ...Typography.body,
    fontWeight: '600',
  },
  reasonLabelSelected: {
    color: Colors.primary,
  },
  reasonDescription: {
    ...Typography.small,
    marginTop: 2,
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  additionalInfoContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  textInput: {
    ...Typography.body,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 100,
    borderWidth: 1,
  },
  charCount: {
    ...Typography.small,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  submitButton: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
  disclaimer: {
    ...Typography.small,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
});
