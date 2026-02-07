/**
 * ChangePassword Screen
 * Change password from settings
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { authApi } from '@/lib/api';

interface PasswordRequirement {
  label: string;
  check: (password: string) => boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: 'At least 8 characters', check: (p) => p.length >= 8 },
  { label: 'One uppercase letter', check: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', check: (p) => /[a-z]/.test(p) },
  { label: 'One number', check: (p) => /\d/.test(p) },
  { label: 'One special character', check: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export default function ChangePasswordScreen() {
  const navigation = useNavigation<any>();
  const appColors = useAppColors();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const response = await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to change password');
      }
      return response.data;
    },
    onSuccess: () => {
      Alert.alert(
        'Password Changed',
        'Your password has been updated successfully.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message);
    },
  });

  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const allRequirementsMet = PASSWORD_REQUIREMENTS.every((req) => req.check(newPassword));
  const canSubmit = currentPassword.length > 0 && allRequirementsMet && passwordsMatch;

  const handleChangePassword = useCallback(() => {
    if (!canSubmit) return;
    changePasswordMutation.mutate();
  }, [canSubmit, changePasswordMutation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: appColors.surface, borderBottomColor: appColors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={appColors.textPrimary} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: appColors.textPrimary }]}>Change Password</ThemedText>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Current Password */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: appColors.textSecondary }]}>Current Password</ThemedText>
            <View style={[styles.inputContainer, { backgroundColor: appColors.surface, borderColor: appColors.border }]}>
              <TextInput
                style={[styles.input, { color: appColors.textPrimary }]}
                placeholder="Enter current password"
                placeholderTextColor={appColors.textSecondary}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
                autoComplete="password"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Ionicons
                  name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={appColors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: appColors.textSecondary }]}>New Password</ThemedText>
            <View style={[styles.inputContainer, { backgroundColor: appColors.surface, borderColor: appColors.border }]}>
              <TextInput
                style={[styles.input, { color: appColors.textPrimary }]}
                placeholder="Enter new password"
                placeholderTextColor={appColors.textSecondary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoComplete="new-password"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons
                  name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={appColors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.requirementsContainer}>
              {PASSWORD_REQUIREMENTS.map((req, index) => {
                const isMet = req.check(newPassword);
                return (
                  <View key={index} style={styles.requirementItem}>
                    <Ionicons
                      name={isMet ? 'checkmark-circle' : 'ellipse-outline'}
                      size={16}
                      color={isMet ? Colors.secondary : appColors.textSecondary}
                    />
                    <ThemedText
                      style={[
                        styles.requirementText,
                        { color: appColors.textSecondary },
                        isMet && styles.requirementMet,
                      ]}
                    >
                      {req.label}
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.label, { color: appColors.textSecondary }]}>Confirm New Password</ThemedText>
            <View style={[styles.inputContainer, { backgroundColor: appColors.surface, borderColor: appColors.border }]}>
              <TextInput
                style={[styles.input, { color: appColors.textPrimary }]}
                placeholder="Confirm new password"
                placeholderTextColor={appColors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoComplete="new-password"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={appColors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && (
              <View style={styles.matchIndicator}>
                <Ionicons
                  name={passwordsMatch ? 'checkmark-circle' : 'close-circle'}
                  size={16}
                  color={passwordsMatch ? Colors.secondary : appColors.error}
                />
                <ThemedText
                  style={[
                    styles.matchText,
                    { color: passwordsMatch ? Colors.secondary : appColors.error },
                  ]}
                >
                  {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, !canSubmit && [styles.submitButtonDisabled, { backgroundColor: appColors.textSecondary }]]}
            onPress={handleChangePassword}
            disabled={!canSubmit || changePasswordMutation.isPending}
          >
            {changePasswordMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <ThemedText style={styles.submitButtonText}>Update Password</ThemedText>
            )}
          </TouchableOpacity>

          {/* Security Note */}
          <View style={styles.securityNote}>
            <Ionicons name="shield-checkmark-outline" size={20} color={appColors.textSecondary} />
            <ThemedText style={[styles.securityNoteText, { color: appColors.textSecondary }]}>
              For your security, you'll be logged out of all other devices after changing your password.
            </ThemedText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.heading,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  label: {
    ...Typography.caption,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    ...Typography.body,
    padding: Spacing.md,
  },
  eyeButton: {
    padding: Spacing.md,
  },
  requirementsContainer: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  requirementText: {
    ...Typography.small,
  },
  requirementMet: {
    color: Colors.secondary,
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  matchText: {
    ...Typography.small,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  securityNoteText: {
    ...Typography.small,
    flex: 1,
    lineHeight: 20,
  },
});
