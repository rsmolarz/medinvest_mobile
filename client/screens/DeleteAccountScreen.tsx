/**
 * DeleteAccount Screen
 * Permanent account deletion (App Store requirement)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
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
import { useAuth } from '@/contexts/AuthContext';

export default function DeleteAccountScreen() {
  const navigation = useNavigation<any>();
  const appColors = useAppColors();
  const { user, logout } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [understoodConsequences, setUnderstoodConsequences] = useState(false);

  const CONFIRM_PHRASE = 'DELETE MY ACCOUNT';
  const isConfirmValid = confirmText === CONFIRM_PHRASE;
  const canDelete = password.length > 0 && isConfirmValid && understoodConsequences;

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await authApi.deleteAccount(password);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to delete account');
      }
      return response.data;
    },
    onSuccess: async () => {
      await logout();
      Alert.alert(
        'Account Deleted',
        'Your account has been permanently deleted. We\'re sorry to see you go.',
        [{ text: 'OK' }]
      );
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleDelete = useCallback(() => {
    if (!canDelete) return;

    Alert.alert(
      'Final Confirmation',
      'This action cannot be undone. Are you absolutely sure you want to delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: () => deleteAccountMutation.mutate(),
        },
      ]
    );
  }, [canDelete, deleteAccountMutation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: appColors.surface, borderBottomColor: appColors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={appColors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: appColors.error }]}>Delete Account</ThemedText>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Warning Banner */}
        <View style={[styles.warningBanner, { borderColor: appColors.error + '30' }]}>
          <Ionicons name="warning" size={32} color={appColors.error} />
          <ThemedText style={[styles.warningTitle, { color: appColors.error }]}>This action is permanent</ThemedText>
          <ThemedText style={[styles.warningText, { color: appColors.textSecondary }]}>
            Deleting your account will permanently remove all your data. This cannot be undone.
          </ThemedText>
        </View>

        {/* What will be deleted */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: appColors.textPrimary }]}>What will be deleted:</ThemedText>
          <View style={styles.deleteList}>
            {[
              'Your profile and all personal information',
              'All posts, comments, and reactions',
              'Your message history',
              'Investment interest submissions',
              'Achievements, points, and leaderboard ranking',
              'Premium subscription (no refund)',
              'All bookmarks and saved content',
            ].map((item, index) => (
              <View key={index} style={styles.deleteItem}>
                <Ionicons name="close-circle" size={16} color={appColors.error} />
                <ThemedText style={[styles.deleteItemText, { color: appColors.textSecondary }]}>{item}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Alternatives */}
        <View style={[styles.alternativeSection, { backgroundColor: appColors.surface }]}>
          <ThemedText style={[styles.alternativeTitle, { color: appColors.textPrimary }]}>
            Before you go, consider these alternatives:
          </ThemedText>
          <TouchableOpacity style={[styles.alternativeItem, { borderBottomColor: appColors.border }]}>
            <Ionicons name="pause-circle-outline" size={24} color={Colors.primary} />
            <View style={styles.alternativeContent}>
              <ThemedText style={styles.alternativeItemTitle}>Deactivate instead</ThemedText>
              <ThemedText style={[styles.alternativeItemText, { color: appColors.textSecondary }]}>
                Temporarily hide your profile without deleting data
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={appColors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.alternativeItem, { borderBottomColor: appColors.border }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="notifications-off-outline" size={24} color={Colors.primary} />
            <View style={styles.alternativeContent}>
              <ThemedText style={styles.alternativeItemTitle}>Adjust notifications</ThemedText>
              <ThemedText style={[styles.alternativeItemText, { color: appColors.textSecondary }]}>
                Reduce emails and push notifications
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={appColors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Confirmation Section */}
        <View style={styles.confirmSection}>
          <ThemedText style={[styles.sectionTitle, { color: appColors.textPrimary }]}>Confirm Deletion</ThemedText>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setUnderstoodConsequences(!understoodConsequences)}
          >
            <View style={[styles.checkbox, { borderColor: appColors.border }, understoodConsequences && [styles.checkboxChecked, { backgroundColor: appColors.error, borderColor: appColors.error }]]}>
              {understoodConsequences && (
                <Ionicons name="checkmark" size={16} color="white" />
              )}
            </View>
            <ThemedText style={[styles.checkboxText, { color: appColors.textPrimary }]}>
              I understand that deleting my account is permanent and cannot be undone
            </ThemedText>
          </TouchableOpacity>

          <ThemedText style={[styles.inputLabel, { color: appColors.textSecondary }]}>Enter your password</ThemedText>
          <View style={[styles.inputContainer, { backgroundColor: appColors.surface, borderColor: appColors.border }]}>
            <TextInput
              style={[styles.input, { color: appColors.textPrimary }]}
              placeholder="Password"
              placeholderTextColor={appColors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={appColors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <ThemedText style={[styles.inputLabel, { color: appColors.textSecondary }]}>
            Type <ThemedText style={[styles.confirmPhrase, { color: appColors.error }]}>{CONFIRM_PHRASE}</ThemedText> to confirm
          </ThemedText>
          <TextInput
            style={[styles.input, styles.confirmInput, { color: appColors.textPrimary, backgroundColor: appColors.surface, borderColor: appColors.border }]}
            placeholder={CONFIRM_PHRASE}
            placeholderTextColor={appColors.textSecondary}
            value={confirmText}
            onChangeText={setConfirmText}
            autoCapitalize="characters"
          />
          {confirmText.length > 0 && !isConfirmValid && (
            <ThemedText style={[styles.errorText, { color: appColors.error }]}>
              Please type exactly: {CONFIRM_PHRASE}
            </ThemedText>
          )}
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: appColors.error }, !canDelete && [styles.deleteButtonDisabled, { backgroundColor: appColors.textSecondary }]]}
          onPress={handleDelete}
          disabled={!canDelete || deleteAccountMutation.isPending}
        >
          {deleteAccountMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color="white" />
              <ThemedText style={styles.deleteButtonText}>Delete My Account Forever</ThemedText>
            </>
          )}
        </TouchableOpacity>

        {/* Cancel */}
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <ThemedText style={[styles.cancelButtonText, { color: appColors.textSecondary }]}>Cancel</ThemedText>
        </TouchableOpacity>
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
  warningBanner: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
  },
  warningTitle: {
    ...Typography.heading,
    marginTop: Spacing.sm,
  },
  warningText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  deleteList: {
    gap: Spacing.sm,
  },
  deleteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  deleteItemText: {
    ...Typography.body,
    flex: 1,
  },
  alternativeSection: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  alternativeTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  alternativeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  alternativeContent: {
    flex: 1,
  },
  alternativeItemTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
  },
  alternativeItemText: {
    ...Typography.small,
    marginTop: 2,
  },
  confirmSection: {
    marginBottom: Spacing.xl,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {},
  checkboxText: {
    ...Typography.body,
    flex: 1,
    lineHeight: 22,
  },
  inputLabel: {
    ...Typography.caption,
    marginBottom: Spacing.sm,
  },
  confirmPhrase: {
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  input: {
    flex: 1,
    ...Typography.body,
    padding: Spacing.md,
  },
  confirmInput: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  eyeButton: {
    padding: Spacing.md,
  },
  errorText: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  cancelButtonText: {
    ...Typography.body,
  },
});
