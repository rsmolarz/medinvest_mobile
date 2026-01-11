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
import { authApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function DeleteAccountScreen() {
  const navigation = useNavigation<any>();
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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Delete Account</ThemedText>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={32} color={Colors.error} />
          <ThemedText style={styles.warningTitle}>This action is permanent</ThemedText>
          <ThemedText style={styles.warningText}>
            Deleting your account will permanently remove all your data. This cannot be undone.
          </ThemedText>
        </View>

        {/* What will be deleted */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>What will be deleted:</ThemedText>
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
                <Ionicons name="close-circle" size={16} color={Colors.error} />
                <ThemedText style={styles.deleteItemText}>{item}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Alternatives */}
        <View style={styles.alternativeSection}>
          <ThemedText style={styles.alternativeTitle}>
            Before you go, consider these alternatives:
          </ThemedText>
          <TouchableOpacity style={styles.alternativeItem}>
            <Ionicons name="pause-circle-outline" size={24} color={Colors.primary} />
            <View style={styles.alternativeContent}>
              <ThemedText style={styles.alternativeItemTitle}>Deactivate instead</ThemedText>
              <ThemedText style={styles.alternativeItemText}>
                Temporarily hide your profile without deleting data
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.alternativeItem}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="notifications-off-outline" size={24} color={Colors.primary} />
            <View style={styles.alternativeContent}>
              <ThemedText style={styles.alternativeItemTitle}>Adjust notifications</ThemedText>
              <ThemedText style={styles.alternativeItemText}>
                Reduce emails and push notifications
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Confirmation Section */}
        <View style={styles.confirmSection}>
          <ThemedText style={styles.sectionTitle}>Confirm Deletion</ThemedText>

          {/* Checkbox */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setUnderstoodConsequences(!understoodConsequences)}
          >
            <View style={[styles.checkbox, understoodConsequences && styles.checkboxChecked]}>
              {understoodConsequences && (
                <Ionicons name="checkmark" size={16} color="white" />
              )}
            </View>
            <ThemedText style={styles.checkboxText}>
              I understand that deleting my account is permanent and cannot be undone
            </ThemedText>
          </TouchableOpacity>

          {/* Password */}
          <ThemedText style={styles.inputLabel}>Enter your password</ThemedText>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.textSecondary}
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
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Type confirmation */}
          <ThemedText style={styles.inputLabel}>
            Type <ThemedText style={styles.confirmPhrase}>{CONFIRM_PHRASE}</ThemedText> to confirm
          </ThemedText>
          <TextInput
            style={[styles.input, styles.confirmInput]}
            placeholder={CONFIRM_PHRASE}
            placeholderTextColor={Colors.textSecondary}
            value={confirmText}
            onChangeText={setConfirmText}
            autoCapitalize="characters"
          />
          {confirmText.length > 0 && !isConfirmValid && (
            <ThemedText style={styles.errorText}>
              Please type exactly: {CONFIRM_PHRASE}
            </ThemedText>
          )}
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          style={[styles.deleteButton, !canDelete && styles.deleteButtonDisabled]}
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
          <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.heading,
    color: Colors.error,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  warningBanner: {
    backgroundColor: Colors.error + '10',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  warningTitle: {
    ...Typography.heading,
    color: Colors.error,
    marginTop: Spacing.sm,
  },
  warningText: {
    ...Typography.body,
    color: Colors.textSecondary,
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
    color: Colors.textPrimary,
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
    color: Colors.textSecondary,
    flex: 1,
  },
  alternativeSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  alternativeTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  alternativeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
    color: Colors.textSecondary,
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
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  checkboxText: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 22,
  },
  inputLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  confirmPhrase: {
    fontWeight: '700',
    color: Colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    padding: Spacing.md,
  },
  confirmInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eyeButton: {
    padding: Spacing.md,
  },
  errorText: {
    ...Typography.small,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  deleteButtonDisabled: {
    backgroundColor: Colors.textSecondary,
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
    color: Colors.textSecondary,
  },
});
