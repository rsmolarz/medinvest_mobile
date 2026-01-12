/**
 * Mute User Service and Components
 * Hide content without blocking
 */

import React, { useState, useCallback, useEffect, memo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useThemeContext } from '@/contexts/ThemeContext';
import { haptics } from '@/lib/haptics';
import { usersApi } from '@/lib/api';

// Types
export interface MutedUser {
  id: number;
  full_name: string;
  username?: string;
  avatar_url?: string;
  muted_at: string;
  mute_posts: boolean;
  mute_comments: boolean;
  mute_messages: boolean;
  mute_notifications: boolean;
  duration?: 'forever' | '1day' | '7days' | '30days';
  expires_at?: string;
}

export interface MuteOptions {
  mute_posts: boolean;
  mute_comments: boolean;
  mute_messages: boolean;
  mute_notifications: boolean;
  duration: 'forever' | '1day' | '7days' | '30days';
}

const STORAGE_KEY = 'muted_users';

// =============================================================================
// MUTE SERVICE
// =============================================================================

class MuteService {
  private mutedUsers: Map<number, MutedUser> = new Map();
  private loaded: boolean = false;

  async loadMutedUsers(): Promise<MutedUser[]> {
    if (this.loaded) {
      return Array.from(this.mutedUsers.values());
    }

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as MutedUser[];
        // Filter out expired mutes
        const now = new Date();
        parsed.forEach(user => {
          if (!user.expires_at || new Date(user.expires_at) > now) {
            this.mutedUsers.set(user.id, user);
          }
        });
      }
      this.loaded = true;
      return Array.from(this.mutedUsers.values());
    } catch (error) {
      console.error('[MuteService] Error loading muted users:', error);
      return [];
    }
  }

  private async persist(): Promise<void> {
    try {
      const users = Array.from(this.mutedUsers.values());
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('[MuteService] Error saving muted users:', error);
    }
  }

  async muteUser(user: { id: number; full_name: string; username?: string; avatar_url?: string }, options: MuteOptions): Promise<void> {
    await this.loadMutedUsers();

    const now = new Date();
    let expiresAt: string | undefined;

    if (options.duration !== 'forever') {
      const expiryDate = new Date(now);
      switch (options.duration) {
        case '1day':
          expiryDate.setDate(expiryDate.getDate() + 1);
          break;
        case '7days':
          expiryDate.setDate(expiryDate.getDate() + 7);
          break;
        case '30days':
          expiryDate.setDate(expiryDate.getDate() + 30);
          break;
      }
      expiresAt = expiryDate.toISOString();
    }

    const mutedUser: MutedUser = {
      id: user.id,
      full_name: user.full_name,
      username: user.username,
      avatar_url: user.avatar_url,
      muted_at: now.toISOString(),
      mute_posts: options.mute_posts,
      mute_comments: options.mute_comments,
      mute_messages: options.mute_messages,
      mute_notifications: options.mute_notifications,
      duration: options.duration,
      expires_at: expiresAt,
    };

    this.mutedUsers.set(user.id, mutedUser);
    await this.persist();

    // TODO: Sync with backend
    // await api.post(`/users/${user.id}/mute`, options);
  }

  async unmuteUser(userId: number): Promise<void> {
    await this.loadMutedUsers();
    this.mutedUsers.delete(userId);
    await this.persist();

    // TODO: Sync with backend
    // await api.delete(`/users/${userId}/mute`);
  }

  async isUserMuted(userId: number): Promise<boolean> {
    await this.loadMutedUsers();
    const muted = this.mutedUsers.get(userId);
    if (!muted) return false;

    // Check if expired
    if (muted.expires_at && new Date(muted.expires_at) <= new Date()) {
      this.mutedUsers.delete(userId);
      await this.persist();
      return false;
    }

    return true;
  }

  async getMuteSettings(userId: number): Promise<MutedUser | null> {
    await this.loadMutedUsers();
    return this.mutedUsers.get(userId) || null;
  }

  async getAllMutedUsers(): Promise<MutedUser[]> {
    await this.loadMutedUsers();
    return Array.from(this.mutedUsers.values())
      .sort((a, b) => new Date(b.muted_at).getTime() - new Date(a.muted_at).getTime());
  }

  shouldHidePost(userId: number): boolean {
    const muted = this.mutedUsers.get(userId);
    return muted?.mute_posts ?? false;
  }

  shouldHideComment(userId: number): boolean {
    const muted = this.mutedUsers.get(userId);
    return muted?.mute_comments ?? false;
  }

  shouldBlockMessages(userId: number): boolean {
    const muted = this.mutedUsers.get(userId);
    return muted?.mute_messages ?? false;
  }

  shouldHideNotifications(userId: number): boolean {
    const muted = this.mutedUsers.get(userId);
    return muted?.mute_notifications ?? false;
  }
}

export const muteService = new MuteService();

// =============================================================================
// MUTE OPTIONS MODAL
// =============================================================================

interface MuteOptionsModalProps {
  visible: boolean;
  user: { id: number; full_name: string; username?: string; avatar_url?: string } | null;
  onClose: () => void;
  onMute: (options: MuteOptions) => void;
}

export const MuteOptionsModal = memo(function MuteOptionsModal({
  visible,
  user,
  onClose,
  onMute,
}: MuteOptionsModalProps) {
  const { colors } = useThemeContext();
  const [options, setOptions] = useState<MuteOptions>({
    mute_posts: true,
    mute_comments: true,
    mute_messages: false,
    mute_notifications: true,
    duration: 'forever',
  });

  const durations = [
    { value: '1day', label: '24 hours' },
    { value: '7days', label: '7 days' },
    { value: '30days', label: '30 days' },
    { value: 'forever', label: 'Forever' },
  ] as const;

  const handleMute = () => {
    haptics.buttonPress();
    onMute(options);
    onClose();
  };

  if (!user) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <ThemedText style={[styles.cancelText, { color: colors.textSecondary }]}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
          <ThemedText style={[styles.modalTitle, { color: colors.textPrimary }]}>
            Mute {user.full_name.split(' ')[0]}
          </ThemedText>
          <TouchableOpacity onPress={handleMute}>
            <ThemedText style={[styles.muteText, { color: colors.primary }]}>
              Mute
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* User info */}
        <View style={styles.userInfo}>
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <ThemedText style={styles.avatarText}>
                {user.full_name.split(' ').map(n => n[0]).join('')}
              </ThemedText>
            </View>
          )}
          <View style={styles.userDetails}>
            <ThemedText style={[styles.userName, { color: colors.textPrimary }]}>
              {user.full_name}
            </ThemedText>
            {user.username && (
              <ThemedText style={[styles.userHandle, { color: colors.textSecondary }]}>
                @{user.username}
              </ThemedText>
            )}
          </View>
        </View>

        {/* Info */}
        <View style={[styles.infoBox, { backgroundColor: colors.backgroundSecondary }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
          <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
            Muted users won't know they've been muted. You can unmute them anytime.
          </ThemedText>
        </View>

        {/* Options */}
        <View style={styles.optionsSection}>
          <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            WHAT TO MUTE
          </ThemedText>
          <View style={[styles.optionsContainer, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.optionRow, { borderBottomColor: colors.border }]}
              onPress={() => {
                haptics.selection();
                setOptions(o => ({ ...o, mute_posts: !o.mute_posts }));
              }}
            >
              <Ionicons name="document-text-outline" size={20} color={colors.textPrimary} />
              <ThemedText style={[styles.optionLabel, { color: colors.textPrimary }]}>
                Posts
              </ThemedText>
              <Ionicons
                name={options.mute_posts ? 'checkbox' : 'square-outline'}
                size={22}
                color={options.mute_posts ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionRow, { borderBottomColor: colors.border }]}
              onPress={() => {
                haptics.selection();
                setOptions(o => ({ ...o, mute_comments: !o.mute_comments }));
              }}
            >
              <Ionicons name="chatbubble-outline" size={20} color={colors.textPrimary} />
              <ThemedText style={[styles.optionLabel, { color: colors.textPrimary }]}>
                Comments
              </ThemedText>
              <Ionicons
                name={options.mute_comments ? 'checkbox' : 'square-outline'}
                size={22}
                color={options.mute_comments ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionRow, { borderBottomColor: colors.border }]}
              onPress={() => {
                haptics.selection();
                setOptions(o => ({ ...o, mute_messages: !o.mute_messages }));
              }}
            >
              <Ionicons name="mail-outline" size={20} color={colors.textPrimary} />
              <ThemedText style={[styles.optionLabel, { color: colors.textPrimary }]}>
                Messages
              </ThemedText>
              <Ionicons
                name={options.mute_messages ? 'checkbox' : 'square-outline'}
                size={22}
                color={options.mute_messages ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => {
                haptics.selection();
                setOptions(o => ({ ...o, mute_notifications: !o.mute_notifications }));
              }}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
              <ThemedText style={[styles.optionLabel, { color: colors.textPrimary }]}>
                Notifications
              </ThemedText>
              <Ionicons
                name={options.mute_notifications ? 'checkbox' : 'square-outline'}
                size={22}
                color={options.mute_notifications ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Duration */}
        <View style={styles.optionsSection}>
          <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            DURATION
          </ThemedText>
          <View style={[styles.optionsContainer, { backgroundColor: colors.surface }]}>
            {durations.map((duration, index) => (
              <TouchableOpacity
                key={duration.value}
                style={[
                  styles.optionRow,
                  index < durations.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
                ]}
                onPress={() => {
                  haptics.selection();
                  setOptions(o => ({ ...o, duration: duration.value }));
                }}
              >
                <ThemedText style={[styles.optionLabel, { color: colors.textPrimary, marginLeft: 0 }]}>
                  {duration.label}
                </ThemedText>
                {options.duration === duration.value && (
                  <Ionicons name="checkmark" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
});

// =============================================================================
// MUTED USERS SCREEN
// =============================================================================

export function MutedUsersScreen({ navigation }: any) {
  const { colors } = useThemeContext();
  const [mutedUsers, setMutedUsers] = useState<MutedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMutedUsers();
  }, []);

  const loadMutedUsers = async () => {
    setIsLoading(true);
    const users = await muteService.getAllMutedUsers();
    setMutedUsers(users);
    setIsLoading(false);
  };

  const handleUnmute = useCallback((user: MutedUser) => {
    Alert.alert(
      'Unmute User',
      `Are you sure you want to unmute ${user.full_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unmute',
          onPress: async () => {
            haptics.buttonPress();
            await muteService.unmuteUser(user.id);
            setMutedUsers(prev => prev.filter(u => u.id !== user.id));
          },
        },
      ]
    );
  }, []);

  const formatDuration = (user: MutedUser): string => {
    if (user.duration === 'forever') return 'Forever';
    if (user.expires_at) {
      const expires = new Date(user.expires_at);
      const now = new Date();
      const diff = expires.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      if (days <= 0) return 'Expired';
      if (days === 1) return '1 day left';
      return `${days} days left`;
    }
    return '';
  };

  const renderMutedUser = ({ item }: { item: MutedUser }) => (
    <View style={[styles.mutedUserItem, { backgroundColor: colors.surface }]}>
      {item.avatar_url ? (
        <Image source={{ uri: item.avatar_url }} style={styles.listAvatar} />
      ) : (
        <View style={[styles.listAvatar, styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
          <ThemedText style={styles.avatarText}>
            {item.full_name.split(' ').map(n => n[0]).join('')}
          </ThemedText>
        </View>
      )}
      
      <View style={styles.mutedUserInfo}>
        <ThemedText style={[styles.mutedUserName, { color: colors.textPrimary }]}>
          {item.full_name}
        </ThemedText>
        <ThemedText style={[styles.mutedUserMeta, { color: colors.textSecondary }]}>
          {formatDuration(item)}
        </ThemedText>
      </View>

      <TouchableOpacity
        style={[styles.unmuteButton, { borderColor: colors.border }]}
        onPress={() => handleUnmute(item)}
      >
        <ThemedText style={[styles.unmuteButtonText, { color: colors.textPrimary }]}>
          Unmute
        </ThemedText>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="volume-high-outline" size={64} color={colors.textSecondary} />
      <ThemedText style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        No muted users
      </ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Users you mute will appear here
      </ThemedText>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
      <FlatList
        data={mutedUsers}
        renderItem={renderMutedUser}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={mutedUsers.length === 0 ? styles.emptyList : styles.listContent}
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
      />
    </View>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useMuteUser() {
  const [modalVisible, setModalVisible] = useState(false);
  const [targetUser, setTargetUser] = useState<{ id: number; full_name: string; username?: string; avatar_url?: string } | null>(null);

  const openMuteModal = useCallback((user: typeof targetUser) => {
    setTargetUser(user);
    setModalVisible(true);
    haptics.modalOpen();
  }, []);

  const closeMuteModal = useCallback(() => {
    setModalVisible(false);
    setTargetUser(null);
  }, []);

  const handleMute = useCallback(async (options: MuteOptions) => {
    if (!targetUser) return;
    
    await muteService.muteUser(targetUser, options);
    haptics.success();
    Alert.alert('User Muted', `${targetUser.full_name} has been muted.`);
  }, [targetUser]);

  const handleUnmute = useCallback(async (userId: number) => {
    await muteService.unmuteUser(userId);
    haptics.success();
  }, []);

  const isUserMuted = useCallback(async (userId: number) => {
    return muteService.isUserMuted(userId);
  }, []);

  return {
    modalVisible,
    targetUser,
    openMuteModal,
    closeMuteModal,
    handleMute,
    handleUnmute,
    isUserMuted,
    MuteModal: () => (
      <MuteOptionsModal
        visible={modalVisible}
        user={targetUser}
        onClose={closeMuteModal}
        onMute={handleMute}
      />
    ),
  };
}

const styles = StyleSheet.create({
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  cancelText: {
    ...Typography.body,
  },
  modalTitle: {
    ...Typography.heading,
  },
  muteText: {
    ...Typography.body,
    fontWeight: '600',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
  userDetails: {
    marginLeft: Spacing.md,
  },
  userName: {
    ...Typography.body,
    fontWeight: '600',
  },
  userHandle: {
    ...Typography.caption,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  infoText: {
    ...Typography.small,
    flex: 1,
    lineHeight: 18,
  },
  optionsSection: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.small,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  optionsContainer: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.card,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  optionLabel: {
    ...Typography.body,
    flex: 1,
    marginLeft: Spacing.md,
  },

  // Screen styles
  screenContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: Spacing.lg,
  },
  emptyList: {
    flexGrow: 1,
  },
  mutedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  listAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  mutedUserInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  mutedUserName: {
    ...Typography.body,
    fontWeight: '600',
  },
  mutedUserMeta: {
    ...Typography.small,
    marginTop: 2,
  },
  unmuteButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  unmuteButtonText: {
    ...Typography.caption,
    fontWeight: '600',
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
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
