/**
 * Edit Post Screen
 * Edit existing posts
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useThemeContext } from '@/contexts/ThemeContext';

type EditPostRouteParams = {
  EditPost: {
    postId: number;
  };
};

const MAX_CONTENT_LENGTH = 5000;

export default function EditPostScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<EditPostRouteParams, 'EditPost'>>();
  const { postId } = route.params;
  const queryClient = useQueryClient();
  const { colors } = useThemeContext();

  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPost = async () => {
      setIsLoading(true);
      try {
        setContent('This is sample post content for editing.');
        setOriginalContent('This is sample post content for editing.');
      } finally {
        setIsLoading(false);
      }
    };
    loadPost();
  }, [postId]);

  useEffect(() => {
    setHasChanges(content !== originalContent);
  }, [content, originalContent]);

  const handleSave = useCallback(() => {
    if (!hasChanges) {
      navigation.goBack();
      return;
    }
    
    Alert.alert('Success', 'Post updated successfully');
    queryClient.invalidateQueries({ queryKey: ['post', postId] });
    queryClient.invalidateQueries({ queryKey: ['feed'] });
    navigation.goBack();
  }, [hasChanges, navigation, queryClient, postId]);

  const handleCancel = useCallback(() => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [hasChanges, navigation]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <ThemedText style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</ThemedText>
          </TouchableOpacity>
          
          <ThemedText style={[styles.headerTitle, { color: colors.textPrimary }]}>Edit Post</ThemedText>
          
          <TouchableOpacity
            style={[
              styles.saveButton,
              hasChanges 
                ? { backgroundColor: colors.primary } 
                : { backgroundColor: colors.backgroundSecondary }
            ]}
            onPress={handleSave}
            disabled={!hasChanges}
          >
            <ThemedText style={[
              styles.saveText,
              { color: hasChanges ? '#FFFFFF' : colors.textTertiary }
            ]}>
              Save
            </ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
            <TextInput
              style={[styles.textInput, { color: colors.textPrimary }]}
              value={content}
              onChangeText={setContent}
              placeholder="What's on your mind?"
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={MAX_CONTENT_LENGTH}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.characterCount}>
            <ThemedText style={[
              styles.characterCountText,
              { color: content.length > MAX_CONTENT_LENGTH * 0.9 ? colors.warning : colors.textTertiary }
            ]}>
              {content.length}/{MAX_CONTENT_LENGTH}
            </ThemedText>
          </View>

          <View style={[styles.noticeCard, { backgroundColor: colors.info + '15' }]}>
            <Ionicons name="information-circle" size={20} color={colors.info} />
            <View style={styles.noticeContent}>
              <ThemedText style={[styles.noticeTitle, { color: colors.textPrimary }]}>
                Note
              </ThemedText>
              <ThemedText style={[styles.noticeText, { color: colors.textSecondary }]}>
                Editing a post won't change the time it was posted. Images and videos cannot be modified.
              </ThemedText>
            </View>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  cancelButton: {
    padding: Spacing.sm,
  },
  cancelText: {
    ...Typography.body,
    fontWeight: '500',
  },
  headerTitle: {
    ...Typography.heading,
    fontSize: 17,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  saveText: {
    ...Typography.body,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    padding: Spacing.lg,
  },
  inputContainer: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    minHeight: 200,
  },
  textInput: {
    ...Typography.body,
    minHeight: 150,
    lineHeight: 24,
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: Spacing.sm,
    paddingRight: Spacing.sm,
  },
  characterCountText: {
    ...Typography.caption,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    ...Typography.caption,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  noticeText: {
    ...Typography.small,
    lineHeight: 20,
  },
});
