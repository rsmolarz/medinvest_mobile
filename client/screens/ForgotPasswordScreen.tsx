/**
 * ForgotPassword Screen
 * Password reset flow
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { useAuth } from '@/contexts/AuthContext';
import { isValidEmail } from '@/lib/utils';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const appColors = useAppColors();
  const { forgotPassword, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [sent, setSent] = useState(false);

  const validateEmail = (): boolean => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateEmail()) return;

    const success = await forgotPassword(email);
    if (success) {
      setSent(true);
    }
  };

  const handleResend = async () => {
    const success = await forgotPassword(email);
    if (success) {
      Alert.alert('Email Sent', 'A new reset link has been sent to your email.');
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: appColors.surfaceSecondary }]} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={appColors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.successContent}>
          <View style={[styles.successIcon, { backgroundColor: Colors.primary + '15' }]}>
            <Ionicons name="mail" size={48} color={Colors.primary} />
          </View>
          <ThemedText style={[styles.successTitle, { color: appColors.textPrimary }]}>Check Your Email</ThemedText>
          <ThemedText style={[styles.successMessage, { color: appColors.textSecondary }]}>
            We've sent password reset instructions to{'\n'}
            <ThemedText style={[styles.emailHighlight, { color: appColors.textPrimary }]}>{email}</ThemedText>
          </ThemedText>

          <View style={[styles.instructionsContainer, { backgroundColor: appColors.surfaceSecondary }]}>
            <View style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <ThemedText style={styles.instructionNumberText}>1</ThemedText>
              </View>
              <ThemedText style={[styles.instructionText, { color: appColors.textPrimary }]}>
                Open the email we just sent you
              </ThemedText>
            </View>
            <View style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <ThemedText style={styles.instructionNumberText}>2</ThemedText>
              </View>
              <ThemedText style={[styles.instructionText, { color: appColors.textPrimary }]}>
                Click the reset password link
              </ThemedText>
            </View>
            <View style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <ThemedText style={styles.instructionNumberText}>3</ThemedText>
              </View>
              <ThemedText style={[styles.instructionText, { color: appColors.textPrimary }]}>
                Create a new password
              </ThemedText>
            </View>
          </View>

          <TouchableOpacity style={styles.resendButton} onPress={handleResend}>
            <ThemedText style={styles.resendText}>
              Didn't receive the email? Resend
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backToLoginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="arrow-back" size={18} color={Colors.primary} />
            <ThemedText style={styles.backToLoginText}>Back to Sign In</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={[styles.backButton, { backgroundColor: appColors.surfaceSecondary }]} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color={appColors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: Colors.primary + '15' }]}>
              <Ionicons name="lock-closed-outline" size={48} color={Colors.primary} />
            </View>
            <ThemedText style={[styles.title, { color: appColors.textPrimary }]}>Forgot Password?</ThemedText>
            <ThemedText style={[styles.subtitle, { color: appColors.textSecondary }]}>
              No worries! Enter your email address and we'll send you instructions to reset your password.
            </ThemedText>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <ThemedText style={[styles.label, { color: appColors.textPrimary }]}>Email Address</ThemedText>
              <View style={[styles.inputWrapper, { backgroundColor: appColors.input }, emailError ? [styles.inputError, { borderColor: appColors.error }] : null]}>
                <Ionicons name="mail-outline" size={20} color={appColors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: appColors.textPrimary }]}
                  placeholder="Enter your email"
                  placeholderTextColor={appColors.textSecondary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setEmailError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  testID="input-forgot-email"
                />
              </View>
              {emailError ? (
                <ThemedText style={[styles.errorText, { color: appColors.error }]}>{emailError}</ThemedText>
              ) : null}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
              testID="button-send-reset"
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <ThemedText style={styles.submitButtonText}>Send Reset Link</ThemedText>
              )}
            </TouchableOpacity>

            {/* Back to Login */}
            <TouchableOpacity
              style={styles.backToLoginLink}
              onPress={() => navigation.navigate('Login')}
            >
              <Ionicons name="arrow-back" size={16} color={Colors.primary} />
              <ThemedText style={styles.backToLoginLinkText}>Back to Sign In</ThemedText>
            </TouchableOpacity>
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
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.title,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing['3xl'],
  },
  inputContainer: {
    marginBottom: Spacing.xl,
  },
  label: {
    ...Typography.caption,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 52,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderWidth: 1,
  },
  input: {
    flex: 1,
    ...Typography.body,
    height: '100%',
  },
  errorText: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
  backToLoginLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  backToLoginLinkText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '500',
  },
  successContent: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    paddingTop: Spacing['3xl'],
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  successTitle: {
    ...Typography.title,
    marginBottom: Spacing.md,
  },
  successMessage: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing['3xl'],
  },
  emailHighlight: {
    fontWeight: '600',
  },
  instructionsContainer: {
    width: '100%',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  instructionNumberText: {
    ...Typography.small,
    color: 'white',
    fontWeight: '700',
  },
  instructionText: {
    ...Typography.body,
    flex: 1,
  },
  resendButton: {
    marginBottom: Spacing.xl,
  },
  resendText: {
    ...Typography.body,
    color: Colors.primary,
  },
  backToLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  backToLoginText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '500',
  },
});
