/**
 * Drafts List Screen
 * View and manage saved post drafts
 */

import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';

import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useDraftList, PostDraft } from '@/lib/drafts';
import { haptics } from '@/lib/haptics';
import { formatRelativeTime } from '@/lib/utils';

export default function DraftsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useThemeContext();
  const { drafts, isLoading, refresh, deleteDraft, deleteAllDrafts } = useDraftList();

  const handleOpenDraft = useCallback((draft: PostDraft) => {
    haptics.selection();
    navigation.navigate('CreatePost', { draftId: draft.id });
  }, [navigation]);

  const handleDeleteDraft = useCallback((id: string) => {
    Alert.alert(
      'Delete Draft',
      'Are you sure you want to delete this draft?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            haptics.delete();
            deleteDraft(id);
          },
        },
      ]
    );
  }, [deleteDraft]);

  const handleDeleteAll = useCallback(() => {
    Alert.alert(
      'Delete All Drafts',
      `Are you sure you want to delete all ${drafts.length} drafts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: () => {
            haptics.delete();
            deleteAllDrafts();
          },
        },
      ]
    );
  }, [drafts.length, deleteAllDrafts]);

  const renderRightActions = useCallback((id: string) => {
    return (
      <TouchableOpacity
        style={[styles.deleteAction, { backgroundColor: colors.error }]}
        onPress={() => handleDeleteDraft(id)}
      >
        <Ionicons name="trash-outline" size={24} color="white" />
      </TouchableOpacity>
    );
  }, [handleDeleteDraft, colors.error]);

  const renderDraftItem = useCallback(({ item }: { item: PostDraft }) => {
    const previewText = item.content.trim() || 'No text content';
    const hasMedia = (item.images && item.images.length > 0) || item.videoUri;

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item.id)}
        overshootRight={false}
      >
        <TouchableOpacity
          style={[styles.draftItem, { backgroundColor: colors.surface }]}
          onPress={() => handleOpenDraft(item)}
          activeOpacity={0.7}
        >
          <View style={styles.draftContent}>
            {item.roomName ? (
              <View style={[styles.roomBadge, { backgroundColor: colors.primary + '15' }]}>
                <ThemedText style={[styles.roomName, { color: colors.primary }]}>
                  {item.roomName}
                </ThemedText>
              </View>
            ) : null}

            <ThemedText
              style={[styles.previewText, { color: colors.textPrimary }]}
              numberOfLines={2}
            >
              {previewText}
            </ThemedText>

            <View style={styles.metaRow}>
              <ThemedText style={[styles.timestamp, { color: colors.textSecondary }]}>
                {formatRelativeTime(item.updatedAt)}
              </ThemedText>

              {hasMedia ? (
                <View style={styles.mediaIndicator}>
                  <Ionicons
                    name={item.videoUri ? 'videocam' : 'images'}
                    size={14}
                    color={colors.textSecondary}
                  />
                  {item.images && item.images.length > 1 ? (
                    <ThemedText style={[styles.mediaCount, { color: colors.textSecondary }]}>
                      {item.images.length}
                    </ThemedText>
                  ) : null}
                </View>
              ) : null}

              {item.isAnonymous ? (
                <View style={styles.anonymousBadge}>
                  <Ionicons name="eye-off-outline" size={14} color={colors.textSecondary} />
                  <ThemedText style={[styles.anonymousText, { color: colors.textSecondary }]}>
                    Anonymous
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </View>

          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      </Swipeable>
    );
  }, [colors, handleOpenDraft, renderRightActions]);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
      <ThemedText style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        No drafts
      </ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        When you start writing a post and leave without publishing, it will be saved here automatically.
      </ThemedText>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Drafts
          </ThemedText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Drafts ({drafts.length})
        </ThemedText>
        {drafts.length > 0 ? (
          <TouchableOpacity style={styles.headerRight} onPress={handleDeleteAll}>
            <ThemedText style={[styles.deleteAllText, { color: colors.error }]}>
              Delete All
            </ThemedText>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRight} />
        )}
      </View>

      <FlatList
        data={drafts}
        keyExtractor={(item) => item.id}
        renderItem={renderDraftItem}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={drafts.length === 0 ? styles.emptyList : undefined}
        onRefresh={refresh}
        refreshing={isLoading}
      />
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.heading,
    fontSize: 17,
    fontWeight: '600',
  },
  headerRight: {
    width: 80,
    alignItems: 'flex-end',
  },
  deleteAllText: {
    ...Typography.body,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyList: {
    flex: 1,
  },
  draftItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  draftContent: {
    flex: 1,
  },
  roomBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  roomName: {
    ...Typography.caption,
    fontWeight: '500',
  },
  previewText: {
    ...Typography.body,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  timestamp: {
    ...Typography.small,
  },
  mediaIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mediaCount: {
    ...Typography.small,
  },
  anonymousBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  anonymousText: {
    ...Typography.small,
  },
  separator: {
    height: 1,
    marginLeft: Spacing.lg,
  },
  deleteAction: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.heading,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
});
