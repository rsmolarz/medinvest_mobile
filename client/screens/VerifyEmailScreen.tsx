/**
 * VerifyEmail Screen
 * Email verification flow
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { authApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type VerifyEmailRouteParams = {
  VerifyEmail: {
    token?: string;
    email?: string;
  };
};

export default function VerifyEmailScreen() {
  const navigation = useNavigation<any>();
  const appColors = useAppColors();
  const route = useRoute<RouteProp<VerifyEmailRouteParams, 'VerifyEmail'>>();
  const { token, email } = route.params || {};
  const { refreshUser } = useAuth();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'waiting'>('waiting');
  const [errorMessage, setErrorMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const verifyEmail = async (verificationToken: string) => {
    setStatus('verifying');
    try {
      const response = await authApi.verifyEmail(verificationToken);
      if (response.success) {
        setStatus('success');
        await refreshUser();
      } else {
        setStatus('error');
        setErrorMessage(response.error?.message || 'Verification failed');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('An error occurred during verification');
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || !email) return;
    
    setIsResending(true);
    try {
      const response = await authApi.resendVerificationEmail(email);
      if (response.success) {
        setResendCooldown(60);
      }
    } catch (error) {
    }
    setIsResending(false);
  };

  const handleContinue = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <>
            <View style={styles.iconContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
            <ThemedText style={[styles.title, { color: appColors.textPrimary }]}>Verifying Your Email</ThemedText>
            <ThemedText style={[styles.subtitle, { color: appColors.textSecondary }]}>
              Please wait while we verify your email address...
            </ThemedText>
          </>
        );

      case 'success':
        return (
          <>
            <LinearGradient
              colors={[Colors.secondary, Colors.secondary + 'CC']}
              style={styles.iconContainer}
            >
              <Ionicons name="checkmark" size={48} color="white" />
            </LinearGradient>
            <ThemedText style={[styles.title, { color: appColors.textPrimary }]}>Email Verified!</ThemedText>
            <ThemedText style={[styles.subtitle, { color: appColors.textSecondary }]}>
              Your email has been successfully verified. You now have full access to all features.
            </ThemedText>
            <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
              <ThemedText style={styles.primaryButtonText}>Continue to App</ThemedText>
            </TouchableOpacity>
          </>
        );

      case 'error':
        return (
          <>
            <View style={[styles.iconContainer, styles.errorIcon]}>
              <Ionicons name="close" size={48} color={appColors.error} />
            </View>
            <ThemedText style={[styles.title, { color: appColors.textPrimary }]}>Verification Failed</ThemedText>
            <ThemedText style={[styles.subtitle, { color: appColors.textSecondary }]}>{errorMessage}</ThemedText>
            {email && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleResendEmail}
                disabled={isResending || resendCooldown > 0}
              >
                {isResending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <ThemedText style={styles.primaryButtonText}>
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
                  </ThemedText>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
              <ThemedText style={styles.secondaryButtonText}>Go Back</ThemedText>
            </TouchableOpacity>
          </>
        );

      case 'waiting':
      default:
        return (
          <>
            <View style={styles.iconContainer}>
              <Ionicons name="mail-outline" size={48} color={Colors.primary} />
            </View>
            <ThemedText style={[styles.title, { color: appColors.textPrimary }]}>Verify Your Email</ThemedText>
            <ThemedText style={[styles.subtitle, { color: appColors.textSecondary }]}>
              We've sent a verification link to{'\n'}
              <ThemedText style={styles.emailText}>{email || 'your email'}</ThemedText>
            </ThemedText>

            <View style={styles.instructionsContainer}>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <ThemedText style={styles.instructionNumberText}>1</ThemedText>
                </View>
                <ThemedText style={[styles.instructionText, { color: appColors.textPrimary }]}>
                  Check your email inbox
                </ThemedText>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <ThemedText style={styles.instructionNumberText}>2</ThemedText>
                </View>
                <ThemedText style={[styles.instructionText, { color: appColors.textPrimary }]}>
                  Click the verification link
                </ThemedText>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <ThemedText style={styles.instructionNumberText}>3</ThemedText>
                </View>
                <ThemedText style={[styles.instructionText, { color: appColors.textPrimary }]}>
                  Return to the app
                </ThemedText>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.secondaryButton, (isResending || resendCooldown > 0) && styles.buttonDisabled]}
              onPress={handleResendEmail}
              disabled={isResending || resendCooldown > 0}
            >
              {isResending ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <ThemedText style={styles.secondaryButtonText}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Didn't receive? Resend"}
                </ThemedText>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={handleContinue}>
              <ThemedText style={[styles.skipButtonText, { color: appColors.textSecondary }]}>Skip for now</ThemedText>
            </TouchableOpacity>
          </>
        );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.surface }]}>
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  errorIcon: {
    backgroundColor: Colors.light.backgroundSecondary,
  },
  title: {
    ...Typography.title,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  emailText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  instructionsContainer: {
    width: '100%',
    backgroundColor: Colors.light.backgroundSecondary,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  instructionNumberText: {
    ...Typography.caption,
    color: 'white',
    fontWeight: '700',
  },
  instructionText: {
    ...Typography.body,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  primaryButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: Colors.primary + '15',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  secondaryButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  skipButton: {
    paddingVertical: Spacing.md,
  },
  skipButtonText: {
    ...Typography.body,
  },
});
