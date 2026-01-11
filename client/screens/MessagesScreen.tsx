/**
 * Messages Screen
 * Direct messaging inbox showing all conversations
 */

import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { messagesApi } from '@/lib/api';
import { Conversation } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

export default function MessagesScreen() {
  const navigation = useNavigation<any>();

  const {
    data: conversationsData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await messagesApi.getConversations();
      return response.data?.conversations || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const conversations = conversationsData || [];

  const handleConversationPress = useCallback((userId: number) => {
    navigation.navigate('Conversation', { userId });
  }, [navigation]);

  const handleNewMessage = useCallback(() => {
    navigation.navigate('NewConversation');
  }, [navigation]);

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleConversationPress(item.other_user.id)}
    >
      {/* Avatar */}
      {item.other_user.avatar_url ? (
        <Image source={{ uri: item.other_user.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <ThemedText style={styles.avatarText}>
            {item.other_user.first_name[0]}{item.other_user.last_name[0]}
          </ThemedText>
        </View>
      )}

      {/* Content */}
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <View style={styles.nameContainer}>
            <ThemedText style={styles.userName} numberOfLines={1}>
              {item.other_user.full_name}
            </ThemedText>
            {item.other_user.is_verified && (
              <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
            )}
          </View>
          {item.last_message_at && (
            <ThemedText style={styles.timestamp}>
              {formatRelativeTime(item.last_message_at)}
            </ThemedText>
          )}
        </View>
        <View style={styles.messageRow}>
          <ThemedText
            style={[
              styles.lastMessage,
              item.unread_count > 0 && styles.lastMessageUnread,
            ]}
            numberOfLines={1}
          >
            {item.last_message || 'Start a conversation'}
          </ThemedText>
          {item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <ThemedText style={styles.unreadCount}>
                {item.unread_count > 99 ? '99+' : item.unread_count}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color={Colors.textSecondary} />
      <ThemedText style={styles.emptyTitle}>No messages yet</ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        Start a conversation with someone!
      </ThemedText>
      <TouchableOpacity style={styles.emptyButton} onPress={handleNewMessage}>
        <ThemedText style={styles.emptyButtonText}>New Message</ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Messages</ThemedText>
        <TouchableOpacity style={styles.newMessageButton} onPress={handleNewMessage}>
          <Ionicons name="create-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Conversations List */}
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={conversations.length === 0 ? styles.emptyList : undefined}
        showsVerticalScrollIndicator={false}
      />
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.title,
    color: Colors.textPrimary,
  },
  newMessageButton: {
    padding: Spacing.sm,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: Spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  userName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  timestamp: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
  },
  lastMessageUnread: {
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  unreadCount: {
    ...Typography.small,
    color: 'white',
    fontWeight: '600',
    fontSize: 11,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.heading,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  emptyButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  emptyButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
});
