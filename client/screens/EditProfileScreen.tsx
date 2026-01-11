/**
 * EditProfile Screen
 * Edit user profile information and avatar
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useMutation } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { usersApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const SPECIALTIES = [
  'Internal Medicine',
  'Cardiology',
  'Oncology',
  'Neurology',
  'Orthopedics',
  'Dermatology',
  'Pediatrics',
  'Psychiatry',
  'Radiology',
  'Surgery',
  'Family Medicine',
  'Emergency Medicine',
  'Investor',
  'Healthcare Executive',
  'Researcher',
  'Other',
];

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, updateUser, refreshUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [specialty, setSpecialty] = useState(user?.specialty || '');
  const [avatarUri, setAvatarUri] = useState(user?.avatar_url || '');
  const [showSpecialtyPicker, setShowSpecialtyPicker] = useState(false);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const response = await usersApi.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        bio: bio.trim(),
        specialty: specialty || undefined,
      });
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to update profile');
      }
      return response.data;
    },
    onSuccess: (data) => {
      if (data) {
        updateUser(data);
      }
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message);
    },
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (uri: string) => {
      const formData = new FormData();
      formData.append('avatar', {
        uri,
        name: 'avatar.jpg',
        type: 'image/jpeg',
      } as any);
      
      const response = await usersApi.uploadAvatar(formData);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to upload avatar');
      }
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.avatar_url) {
        setAvatarUri(data.avatar_url);
        updateUser({ avatar_url: data.avatar_url });
      }
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadAvatarMutation.mutate(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'First name and last name are required');
      return;
    }
    updateProfileMutation.mutate();
  };

  const hasChanges = 
    firstName !== user?.first_name ||
    lastName !== user?.last_name ||
    bio !== (user?.bio || '') ||
    specialty !== (user?.specialty || '');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <ThemedText style={styles.cancelText}>Cancel</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Edit Profile</ThemedText>
        <TouchableOpacity
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!hasChanges || updateProfileMutation.isPending}
        >
          {updateProfileMutation.isPending ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <ThemedText style={[styles.saveText, !hasChanges && styles.saveTextDisabled]}>
              Save
            </ThemedText>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <ThemedText style={styles.avatarText}>
                  {firstName[0]}{lastName[0]}
                </ThemedText>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              {uploadAvatarMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="camera" size={16} color="white" />
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePickImage}>
            <ThemedText style={styles.changePhotoText}>Change Photo</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>First Name</ThemedText>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter your first name"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Last Name</ThemedText>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter your last name"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Bio</ThemedText>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <ThemedText style={styles.charCount}>{bio.length}/500</ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Specialty</ThemedText>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowSpecialtyPicker(!showSpecialtyPicker)}
            >
              <ThemedText style={specialty ? styles.pickerText : styles.pickerPlaceholder}>
                {specialty || 'Select your specialty'}
              </ThemedText>
              <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {showSpecialtyPicker && (
            <View style={styles.specialtyPicker}>
              {SPECIALTIES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.specialtyOption,
                    specialty === s && styles.specialtyOptionSelected,
                  ]}
                  onPress={() => {
                    setSpecialty(s);
                    setShowSpecialtyPicker(false);
                  }}
                >
                  <ThemedText style={[
                    styles.specialtyOptionText,
                    specialty === s && styles.specialtyOptionTextSelected,
                  ]}>
                    {s}
                  </ThemedText>
                  {specialty === s && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Email (read-only) */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <View style={styles.readOnlyInput}>
              <ThemedText style={styles.readOnlyText}>{user?.email}</ThemedText>
              <Ionicons name="lock-closed" size={16} color={Colors.textSecondary} />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cancelButton: {
    padding: Spacing.sm,
  },
  cancelText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  headerTitle: {
    ...Typography.heading,
    color: Colors.textPrimary,
  },
  saveButton: {
    padding: Spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  saveTextDisabled: {
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.title,
    color: Colors.primary,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  changePhotoText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  form: {
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    ...Typography.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bioInput: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  charCount: {
    ...Typography.small,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  pickerPlaceholder: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  specialtyPicker: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
    marginTop: -Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 200,
  },
  specialtyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  specialtyOptionSelected: {
    backgroundColor: Colors.primary + '10',
  },
  specialtyOptionText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  specialtyOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  readOnlyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  readOnlyText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
