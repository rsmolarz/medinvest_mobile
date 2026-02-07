/**
 * Biometric Settings Screen
 * Enable/disable Face ID / Touch ID login
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { biometricAuth, BiometricStatus } from '@/lib/biometric-auth';

export default function BiometricSettingsScreen() {
  const navigation = useNavigation<any>();
  const appColors = useAppColors();
  
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    loadBiometricStatus();
  }, []);

  const loadBiometricStatus = async () => {
    setIsLoading(true);
    try {
      const status = await biometricAuth.checkBiometricAvailability();
      setBiometricStatus(status);
      
      const enabled = await biometricAuth.isBiometricLoginEnabled();
      setIsEnabled(enabled);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = useCallback(async (value: boolean) => {
    if (!biometricStatus?.isAvailable || !biometricStatus?.isEnrolled) {
      Alert.alert(
        'Biometric Not Available',
        'Please set up Face ID or Touch ID in your device settings first.'
      );
      return;
    }

    setIsToggling(true);
    try {
      if (value) {
        Alert.prompt(
          'Enter Password',
          'Enter your password to enable biometric login',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Enable',
              onPress: async (password) => {
                if (!password) {
                  setIsToggling(false);
                  return;
                }
                
                const email = 'user@example.com';
                
                const success = await biometricAuth.enableBiometricLogin(email, password);
                if (success) {
                  setIsEnabled(true);
                  Alert.alert('Success', `${biometricAuth.getBiometricName(biometricStatus.biometricType)} login enabled!`);
                } else {
                  Alert.alert('Failed', 'Could not enable biometric login. Please try again.');
                }
                setIsToggling(false);
              },
            },
          ],
          'secure-text'
        );
      } else {
        const success = await biometricAuth.disableBiometricLogin();
        if (success) {
          setIsEnabled(false);
        }
        setIsToggling(false);
      }
    } catch (error) {
      console.error('Error toggling biometric:', error);
      setIsToggling(false);
    }
  }, [biometricStatus]);

  const biometricName = biometricStatus 
    ? biometricAuth.getBiometricName(biometricStatus.biometricType)
    : 'Biometric';

  const biometricIcon = biometricStatus?.biometricType === 'facial' 
    ? 'scan-outline' 
    : 'finger-print-outline';

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: appColors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: appColors.surface, borderBottomColor: appColors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={appColors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: appColors.textPrimary }]}>Biometric Login</ThemedText>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name={biometricIcon} size={64} color={Colors.primary} />
        </View>

        <ThemedText style={[styles.title, { color: appColors.textPrimary }]}>{biometricName}</ThemedText>
        <ThemedText style={[styles.description, { color: appColors.textSecondary }]}>
          Sign in quickly and securely using {biometricName} instead of entering your password.
        </ThemedText>

        {!biometricStatus?.isAvailable && (
          <View style={styles.warningCard}>
            <Ionicons name="warning-outline" size={24} color={appColors.warning} />
            <ThemedText style={[styles.warningText, { color: appColors.textPrimary }]}>
              {biometricName} is not available on this device.
            </ThemedText>
          </View>
        )}

        {biometricStatus?.isAvailable && !biometricStatus?.isEnrolled && (
          <View style={styles.warningCard}>
            <Ionicons name="information-circle-outline" size={24} color={Colors.primary} />
            <ThemedText style={[styles.warningText, { color: appColors.textPrimary }]}>
              {biometricName} is not set up. Please enable it in your device settings.
            </ThemedText>
          </View>
        )}

        {biometricStatus?.isAvailable && biometricStatus?.isEnrolled && (
          <View style={[styles.toggleCard, { backgroundColor: appColors.surface }]}>
            <View style={styles.toggleInfo}>
              <Ionicons name={biometricIcon} size={24} color={Colors.primary} />
              <View style={styles.toggleTextContainer}>
                <ThemedText style={[styles.toggleTitle, { color: appColors.textPrimary }]}>Use {biometricName}</ThemedText>
                <ThemedText style={[styles.toggleDescription, { color: appColors.textSecondary }]}>
                  Sign in with {biometricName} instead of password
                </ThemedText>
              </View>
            </View>
            {isToggling ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <Switch
                value={isEnabled}
                onValueChange={handleToggle}
                trackColor={{ false: appColors.border, true: Colors.primary + '60' }}
                thumbColor={isEnabled ? Colors.primary : appColors.textSecondary}
              />
            )}
          </View>
        )}

        <View style={styles.infoSection}>
          <ThemedText style={[styles.infoTitle, { color: appColors.textSecondary }]}>How it works</ThemedText>
          <View style={styles.infoItem}>
            <View style={styles.infoNumber}>
              <ThemedText style={styles.infoNumberText}>1</ThemedText>
            </View>
            <ThemedText style={[styles.infoText, { color: appColors.textSecondary }]}>
              Your login credentials are securely stored on your device
            </ThemedText>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoNumber}>
              <ThemedText style={styles.infoNumberText}>2</ThemedText>
            </View>
            <ThemedText style={[styles.infoText, { color: appColors.textSecondary }]}>
              When signing in, use {biometricName} to verify your identity
            </ThemedText>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoNumber}>
              <ThemedText style={styles.infoNumberText}>3</ThemedText>
            </View>
            <ThemedText style={[styles.infoText, { color: appColors.textSecondary }]}>
              Your stored credentials are used to sign you in automatically
            </ThemedText>
          </View>
        </View>

        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark-outline" size={20} color={Colors.secondary} />
          <ThemedText style={[styles.securityText, { color: appColors.textSecondary }]}>
            Your credentials are stored securely using device encryption and are never sent to our servers.
          </ThemedText>
        </View>
      </View>
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.heading,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.title,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  warningText: {
    ...Typography.body,
    flex: 1,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleTitle: {
    ...Typography.body,
    fontWeight: '600',
  },
  toggleDescription: {
    ...Typography.small,
    marginTop: 2,
  },
  infoSection: {
    marginBottom: Spacing.xl,
  },
  infoTitle: {
    ...Typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.lg,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  infoNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoNumberText: {
    ...Typography.small,
    color: 'white',
    fontWeight: '600',
  },
  infoText: {
    ...Typography.body,
    flex: 1,
    lineHeight: 22,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.secondary + '10',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  securityText: {
    ...Typography.small,
    flex: 1,
    lineHeight: 20,
  },
});
