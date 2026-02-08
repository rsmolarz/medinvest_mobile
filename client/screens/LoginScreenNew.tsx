/**
 * Login Screen
 * Email/password login with biometric authentication support
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useMutation } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { apiClient } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { biometricAuth, BiometricStatus } from '@/lib/biometric-auth';
import type { User } from '@/types';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const appColors = useAppColors();
  const { setAuthSession, signInWithGoogle, signInWithGithub, signInWithFacebook, signInWithApple, isAppleAuthAvailable, mockSignIn, error: authError, clearError, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus | null>(null);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  // Check biometric availability on mount and clear any stale errors
  useEffect(() => {
    clearError();
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    const status = await biometricAuth.checkBiometricAvailability();
    setBiometricStatus(status);
    
    const enabled = await biometricAuth.isBiometricLoginEnabled();
    setIsBiometricEnabled(enabled);
    
    // Auto-prompt biometric if enabled
    if (enabled && status.isAvailable && status.isEnrolled) {
      handleBiometricLogin();
    }
  };

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      console.log('Login attempt:', { 
        email: credentials.email, 
        apiBaseUrl: apiClient.defaults.baseURL,
        platform: Platform.OS,
      });
      const response = await apiClient.post<{ token: string; user: User }>('/auth/login', credentials);
      console.log('Login response:', response.data);
      return response.data;
    },
    onSuccess: async (data, variables) => {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Prompt to enable biometric if not already enabled
      if (biometricStatus?.isAvailable && biometricStatus?.isEnrolled && !isBiometricEnabled) {
        biometricAuth.promptEnableBiometric(variables.email, variables.password);
      }
      
      if (data?.token && data?.user) {
        await setAuthSession(data.token, data.user);
      }
    },
    onError: (error: any) => {
      console.log('Login error:', JSON.stringify(error, null, 2));
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      const message = error?.message || error?.response?.data?.message || 'Login failed';
      Alert.alert('Login Failed', message);
    },
  });

  // Handle biometric login
  const handleBiometricLogin = useCallback(async () => {
    const credentials = await biometricAuth.getCredentialsWithBiometric();
    
    if (credentials) {
      setEmail(credentials.email);
      loginMutation.mutate(credentials);
    }
  }, [loginMutation]);

  // Handle form submission
  const handleLogin = useCallback(() => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }
    
    loginMutation.mutate({ email: email.trim(), password });
  }, [email, password, loginMutation]);

  const handleForgotPassword = useCallback(() => {
    navigation.navigate('ForgotPassword');
  }, [navigation]);

  const handleRegister = useCallback(() => {
    navigation.navigate('Register');
  }, [navigation]);

  const biometricName = biometricStatus 
    ? biometricAuth.getBiometricName(biometricStatus.biometricType)
    : 'Biometric';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.surface }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Ionicons name="medical" size={48} color="white" />
            </LinearGradient>
          </View>

          <ThemedText style={[styles.title, { color: appColors.textPrimary }]}>Welcome Back</ThemedText>
          <ThemedText style={[styles.subtitle, { color: appColors.textSecondary }]}>
            Sign in to continue to MedInvest
          </ThemedText>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={[styles.inputContainer, { borderColor: appColors.border, backgroundColor: appColors.background }]}>
              <Ionicons name="mail-outline" size={20} color={appColors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: appColors.textPrimary }]}
                placeholder="Email address"
                placeholderTextColor={appColors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loginMutation.isPending}
                testID="input-email"
              />
            </View>

            {/* Password Input */}
            <View style={[styles.inputContainer, { borderColor: appColors.border, backgroundColor: appColors.background }]}>
              <Ionicons name="lock-closed-outline" size={20} color={appColors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: appColors.textPrimary }]}
                placeholder="Password"
                placeholderTextColor={appColors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loginMutation.isPending}
                testID="input-password"
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={appColors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
              <ThemedText style={styles.forgotPasswordText}>Forgot Password?</ThemedText>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loginMutation.isPending && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loginMutation.isPending}
              testID="button-sign-in"
            >
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButtonGradient}
              >
                {loginMutation.isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <ThemedText style={styles.loginButtonText}>Sign In</ThemedText>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Biometric Login Button */}
            {biometricStatus?.isAvailable && biometricStatus?.isEnrolled && isBiometricEnabled && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
                disabled={loginMutation.isPending}
              >
                <Ionicons
                  name={biometricStatus.biometricType === 'facial' ? 'scan-outline' : 'finger-print-outline'}
                  size={24}
                  color={Colors.primary}
                />
                <ThemedText style={styles.biometricButtonText}>
                  Sign in with {biometricName}
                </ThemedText>
              </TouchableOpacity>
            )}

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: appColors.border }]} />
              <ThemedText style={[styles.dividerText, { color: appColors.textSecondary }]}>or continue with</ThemedText>
              <View style={[styles.dividerLine, { backgroundColor: appColors.border }]} />
            </View>

            {/* Auth Error Display */}
            {authError ? (
              <TouchableOpacity onPress={clearError} style={[styles.errorBanner, { backgroundColor: appColors.error + '15', borderColor: appColors.error + '30' }]}>
                <Ionicons name="alert-circle-outline" size={18} color={appColors.error} />
                <ThemedText style={[styles.errorBannerText, { color: appColors.error }]}>{authError}</ThemedText>
                <Ionicons name="close" size={16} color={appColors.error} />
              </TouchableOpacity>
            ) : null}

            {/* Social Login */}
            <View style={styles.socialButtons}>
              <TouchableOpacity 
                style={[styles.socialButton, { borderColor: appColors.border, backgroundColor: appColors.surface }]}
                onPress={() => {
                  console.log('Google button pressed');
                  signInWithGoogle();
                }}
                disabled={authLoading}
                testID="button-google-login"
              >
                <Ionicons name="logo-google" size={20} color={appColors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.socialButton, { borderColor: appColors.border, backgroundColor: appColors.surface }]}
                onPress={() => {
                  console.log('GitHub button pressed');
                  signInWithGithub();
                }}
                disabled={authLoading}
                testID="button-github-login"
              >
                <Ionicons name="logo-github" size={20} color={appColors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.socialButton, { borderColor: appColors.border, backgroundColor: appColors.surface }]}
                onPress={() => {
                  console.log('Facebook button pressed');
                  signInWithFacebook();
                }}
                disabled={authLoading}
                testID="button-facebook-login"
              >
                <Ionicons name="logo-facebook" size={20} color={appColors.textPrimary} />
              </TouchableOpacity>
              {isAppleAuthAvailable && Platform.OS === 'ios' ? (
                <TouchableOpacity 
                  style={[styles.socialButton, { borderColor: appColors.border, backgroundColor: appColors.surface }]}
                  onPress={signInWithApple}
                  disabled={authLoading}
                  testID="button-apple-login"
                >
                  <Ionicons name="logo-apple" size={20} color={appColors.textPrimary} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <ThemedText style={[styles.registerText, { color: appColors.textSecondary }]}>Don't have an account? </ThemedText>
            <TouchableOpacity onPress={handleRegister}>
              <ThemedText style={styles.registerLink}>Sign Up</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Demo Login */}
          <TouchableOpacity
            style={[styles.demoButton, { borderColor: appColors.border }]}
            onPress={mockSignIn}
            disabled={authLoading}
            testID="button-demo-login"
          >
            <Ionicons name="flask-outline" size={18} color={appColors.textSecondary} />
            <ThemedText style={[styles.demoButtonText, { color: appColors.textSecondary }]}>Try Demo Account</ThemedText>
          </TouchableOpacity>
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  title: {
    ...Typography.hero,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  form: {
    marginTop: Spacing.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  errorBannerText: {
    ...Typography.caption,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  inputIcon: {
    marginLeft: Spacing.md,
  },
  input: {
    flex: 1,
    ...Typography.body,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  passwordToggle: {
    padding: Spacing.md,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.xl,
  },
  forgotPasswordText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.card,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonGradient: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  loginButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '700',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  biometricButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...Typography.caption,
    marginHorizontal: Spacing.md,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  registerText: {
    ...Typography.body,
  },
  registerLink: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  demoButtonText: {
    ...Typography.caption,
    fontWeight: '500',
  },
});
