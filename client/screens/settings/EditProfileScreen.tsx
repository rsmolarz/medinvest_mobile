import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';

import { colors, typography, spacing, layout, shadows } from '@/theme';
import { useUserProfile, useUpdateProfile, useUploadAvatar } from '@/api/hooks';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/types';
import { getApiUrl } from '@/lib/query-client';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { refreshUser } = useAuth();
  
  const { data: user, isLoading: isLoadingUser } = useUserProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

  const getAvatarUrl = (avatarUrl?: string) => {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith('http')) return avatarUrl;
    return `${getApiUrl()}${avatarUrl}`;
  };

  // Form state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form when user data loads
  React.useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleFieldChange = useCallback(
    (setter: (value: string) => void) => (value: string) => {
      setter(value);
      setHasChanges(true);
    },
    []
  );

  const handlePickImage = useCallback(async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to change your avatar.'
      );
      return;
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        await uploadAvatar.mutateAsync(result.assets[0].uri);
        await refreshUser();
        Alert.alert('Success', 'Avatar updated successfully!');
      } catch (error) {
        Alert.alert('Error', 'Failed to upload avatar. Please try again.');
      }
    }
  }, [uploadAvatar, refreshUser]);

  const handleSave = useCallback(async () => {
    if (!hasChanges) return;

    try {
      const updatedData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      };
      await updateProfile.mutateAsync(updatedData);
      await refreshUser();
      Alert.alert('Success', 'Profile updated successfully!');
      setHasChanges(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  }, [firstName, lastName, phone, hasChanges, updateProfile, refreshUser]);

  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  if (isLoadingUser) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="x" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Pressable
          style={styles.saveButton}
          onPress={handleSave}
          disabled={!hasChanges || updateProfile.isPending}
        >
          {updateProfile.isPending ? (
            <ActivityIndicator size="small" color={colors.primary.main} />
          ) : (
            <Text
              style={[
                styles.saveButtonText,
                !hasChanges && styles.saveButtonTextDisabled,
              ]}
            >
              Save
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Section */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.avatarSection}
        >
          <Pressable style={styles.avatarContainer} onPress={handlePickImage}>
            <View style={styles.avatar}>
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: getAvatarUrl(user.avatarUrl) ?? undefined }}
                  style={styles.avatarImage}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <Text style={styles.avatarText}>{getInitials()}</Text>
              )}
            </View>
            <View style={styles.editAvatarBadge}>
              {uploadAvatar.isPending ? (
                <ActivityIndicator size="small" color={colors.text.inverse} />
              ) : (
                <Feather name="camera" size={16} color={colors.text.inverse} />
              )}
            </View>
          </Pressable>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </Animated.View>

        {/* Form Fields */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.formSection}
        >
          {/* First Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>First Name</Text>
            <TextInput
              style={styles.textInput}
              value={firstName}
              onChangeText={handleFieldChange(setFirstName)}
              placeholder="Enter your first name"
              placeholderTextColor={colors.text.tertiary}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* Last Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Last Name</Text>
            <TextInput
              style={styles.textInput}
              value={lastName}
              onChangeText={handleFieldChange(setLastName)}
              placeholder="Enter your last name"
              placeholderTextColor={colors.text.tertiary}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* Email (Read-only) */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={[styles.textInput, styles.textInputDisabled]}>
              <Text style={styles.disabledText}>{user?.email}</Text>
              <Feather name="lock" size={16} color={colors.text.tertiary} />
            </View>
            <Text style={styles.fieldHint}>
              Email cannot be changed for security reasons
            </Text>
          </View>

          {/* Phone */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <TextInput
              style={styles.textInput}
              value={phone}
              onChangeText={handleFieldChange(setPhone)}
              placeholder="+1 (555) 000-0000"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="phone-pad"
              autoCorrect={false}
            />
            <Text style={styles.fieldHint}>
              Used for account verification and security
            </Text>
          </View>
        </Animated.View>

        {/* Verification Status */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(300)}
          style={styles.verificationSection}
        >
          <View style={styles.verificationCard}>
            <View style={styles.verificationHeader}>
              <Feather
                name={user?.isVerified ? 'check-circle' : 'alert-circle'}
                size={24}
                color={
                  user?.isVerified
                    ? colors.semantic.success
                    : colors.semantic.warning
                }
              />
              <Text style={styles.verificationTitle}>
                {user?.isVerified ? 'Verified Investor' : 'Verification Pending'}
              </Text>
            </View>
            <Text style={styles.verificationText}>
              {user?.isVerified
                ? 'Your account is fully verified. You have access to all investment opportunities.'
                : 'Complete verification to access all investment opportunities and higher investment limits.'}
            </Text>
            {!user?.isVerified && (
              <Pressable style={styles.verifyButton}>
                <Text style={styles.verifyButtonText}>Complete Verification</Text>
                <Feather name="arrow-right" size={16} color={colors.primary.main} />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* Danger Zone */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(400)}
          style={styles.dangerSection}
        >
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <Pressable
            style={styles.dangerButton}
            onPress={() => {
              Alert.alert(
                'Delete Account',
                'Are you sure you want to delete your account? This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      // TODO: Implement account deletion
                    },
                  },
                ]
              );
            }}
          >
            <Feather name="trash-2" size={20} color={colors.semantic.error} />
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.surface.primary,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.heading,
    color: colors.text.primary,
  },
  saveButton: {
    padding: spacing.xs,
    minWidth: 50,
    alignItems: 'flex-end',
  },
  saveButtonText: {
    ...typography.bodyMedium,
    color: colors.primary.main,
  },
  saveButtonTextDisabled: {
    color: colors.text.tertiary,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },

  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.hero,
    color: colors.text.inverse,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background.primary,
  },
  avatarHint: {
    ...typography.caption,
    color: colors.text.secondary,
  },

  // Form Section
  formSection: {
    marginBottom: spacing.xl,
  },
  fieldContainer: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    ...typography.captionMedium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: layout.radiusMedium,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text.primary,
  },
  textInputDisabled: {
    backgroundColor: colors.background.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  disabledText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  fieldHint: {
    ...typography.small,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },

  // Verification Section
  verificationSection: {
    marginBottom: spacing.xl,
  },
  verificationCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: layout.radiusMedium,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  verificationTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  verificationText: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  verifyButtonText: {
    ...typography.bodyMedium,
    color: colors.primary.main,
  },

  // Danger Section
  dangerSection: {
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  dangerTitle: {
    ...typography.captionMedium,
    color: colors.semantic.error,
    marginBottom: spacing.md,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: layout.radiusMedium,
    borderWidth: 1,
    borderColor: colors.semantic.error,
  },
  dangerButtonText: {
    ...typography.bodyMedium,
    color: colors.semantic.error,
  },
});
