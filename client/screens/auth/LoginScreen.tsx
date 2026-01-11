import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Feather } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';

import { useAuth } from '@/contexts/AuthContext';
import { colors, typography, spacing, layout, shadows } from '@/theme';

/**
 * Login Screen
 * Centered content with logo, SSO buttons, and legal links
 */
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const {
    signInWithApple,
    signInWithGoogle,
    isLoading,
    error,
    clearError,
    isAppleAuthAvailable,
  } = useAuth();

  // Clear error when component unmounts
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://medinvest.app/privacy');
  };

  const handleTermsOfService = () => {
    Linking.openURL('https://medinvest.app/terms');
  };

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary]}
        style={StyleSheet.absoluteFill}
      />

      {/* Content */}
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + spacing.xl,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
      >
        {/* Logo Section */}
        <Animated.View 
          entering={FadeInDown.duration(600).delay(100)}
          style={styles.logoSection}
        >
          {/* App Icon */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={colors.gradient.colors as unknown as string[]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Feather name="trending-up" size={40} color={colors.text.inverse} />
            </LinearGradient>
          </View>

          {/* App Name */}
          <Text style={styles.appName}>MedInvest</Text>
          
          {/* Tagline */}
          <Text style={styles.tagline}>
            Invest in Medical Innovation
          </Text>
        </Animated.View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Auth Buttons Section */}
        <Animated.View 
          entering={FadeInUp.duration(600).delay(300)}
          style={styles.authSection}
        >
          {/* Error Message */}
          {error && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.errorContainer}>
              <Feather name="alert-circle" size={16} color={colors.semantic.error} />
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}

          {/* Apple Sign In Button */}
          {isAppleAuthAvailable && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={layout.radiusLarge}
              style={styles.appleButton}
              onPress={signInWithApple}
            />
          )}

          {/* Google Sign In Button */}
          <Pressable
            style={({ pressed }) => [
              styles.googleButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={signInWithGoogle}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.text.primary} />
            ) : (
              <>
                <GoogleIcon />
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </>
            )}
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email Sign In (placeholder for future) */}
          <Pressable
            style={({ pressed }) => [
              styles.emailButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => {
              // TODO: Navigate to email sign in
            }}
          >
            <Feather name="mail" size={20} color={colors.primary.main} />
            <Text style={styles.emailButtonText}>Continue with Email</Text>
          </Pressable>
        </Animated.View>

        {/* Legal Links */}
        <Animated.View 
          entering={FadeIn.duration(600).delay(500)}
          style={styles.legalSection}
        >
          <Text style={styles.legalText}>
            By continuing, you agree to our{' '}
            <Text style={styles.legalLink} onPress={handleTermsOfService}>
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text style={styles.legalLink} onPress={handlePrivacyPolicy}>
              Privacy Policy
            </Text>
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

/**
 * Google Icon Component
 */
function GoogleIcon() {
  return (
    <View style={styles.googleIconContainer}>
      <View style={styles.googleIcon}>
        {/* Simplified Google "G" icon */}
        <Text style={styles.googleIconText}>G</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Logo Section
  logoSection: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.elevated,
  },
  appName: {
    ...typography.hero,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  tagline: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Spacer
  spacer: {
    flex: 1,
    minHeight: spacing['3xl'],
    maxHeight: 120,
  },

  // Auth Section
  authSection: {
    width: '100%',
    maxWidth: 320,
    gap: spacing.md,
  },
  
  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: layout.radiusMedium,
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.semantic.error,
    flex: 1,
  },

  // Apple Button
  appleButton: {
    width: '100%',
    height: layout.buttonHeightLarge,
  },

  // Google Button
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    height: layout.buttonHeightLarge,
    backgroundColor: colors.surface.primary,
    borderRadius: layout.radiusLarge,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.card,
  },
  googleButtonText: {
    ...typography.button.medium,
    color: colors.text.primary,
  },
  googleIconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surface.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  googleIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary.main,
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  dividerText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },

  // Email Button
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    height: layout.buttonHeightLarge,
    backgroundColor: 'transparent',
    borderRadius: layout.radiusLarge,
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  emailButtonText: {
    ...typography.button.medium,
    color: colors.primary.main,
  },

  // Button pressed state
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  // Legal Section
  legalSection: {
    marginTop: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
  legalText: {
    ...typography.small,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: colors.primary.main,
    textDecorationLine: 'underline',
  },
});
