/**
 * Conversation Screen
 * Individual message thread with real-time messaging
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { messagesApi, ApiUser, Message } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatRelativeTime } from '@/lib/utils';
import { videoCallService } from '@/lib/video/VideoCallService';

type ConversationRouteParams = {
  Conversation: {
    userId: string;
  };
};

export default function ConversationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ConversationRouteParams, 'Conversation'>>();
  const { userId } = route.params;
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList>(null);
  const appColors = useAppColors();

  const [messageText, setMessageText] = useState('');
  const [otherUser, setOtherUser] = useState<ApiUser | null>(null);

  // Fetch messages
  const {
    data: messagesData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['conversation', userId],
    queryFn: async () => {
      const response = await messagesApi.getConversation(userId);
      if (response.data?.other_user) {
        setOtherUser(response.data.other_user);
      }
      return response.data?.messages || [];
    },
    refetchInterval: 3000,
  });

  const messages = messagesData || [];

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await messagesApi.sendMessage(userId, content);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to send message');
      }
      return response.data;
    },
    onSuccess: () => {
      setMessageText('');
      refetch();
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
  });

  const handleSend = useCallback(() => {
    if (!messageText.trim()) return;
    sendMessageMutation.mutate(messageText.trim());
  }, [messageText, sendMessageMutation]);

  const handleUserPress = useCallback(() => {
    if (otherUser) {
      navigation.navigate('UserProfile', { userId: otherUser.id });
    }
  }, [navigation, otherUser]);

  const handleVoiceCall = useCallback(async () => {
    if (!otherUser) return;
    navigation.navigate('VoiceCall', {
      recipientId: otherUser.id,
      recipientName: otherUser.full_name || `${otherUser.first_name} ${otherUser.last_name}`,
      recipientAvatar: otherUser.avatar_url,
      callType: 'audio',
    });
  }, [navigation, otherUser]);

  const handleVideoCall = useCallback(async () => {
    if (!otherUser) return;
    navigation.navigate('VoiceCall', {
      recipientId: otherUser.id,
      recipientName: otherUser.full_name || `${otherUser.first_name} ${otherUser.last_name}`,
      recipientAvatar: otherUser.avatar_url,
      callType: 'video',
    });
  }, [navigation, otherUser]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages.length]);

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.sender.id === currentUser?.id;
    const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.sender.id !== item.sender.id);
    const showTimestamp = index === messages.length - 1 || 
      messages[index + 1]?.sender.id !== item.sender.id;

    return (
      <View style={[styles.messageContainer, isOwn && styles.messageContainerOwn]}>
        {showAvatar && !isOwn && (
          otherUser?.avatar_url ? (
            <Image source={{ uri: otherUser.avatar_url }} style={styles.messageAvatar} />
          ) : (
            <View style={[styles.messageAvatar, styles.messageAvatarPlaceholder]}>
              <ThemedText style={styles.messageAvatarText}>
                {otherUser?.first_name?.[0]}{otherUser?.last_name?.[0]}
              </ThemedText>
            </View>
          )
        )}
        {!showAvatar && !isOwn && <View style={styles.messageAvatarSpacer} />}
        
        <View style={[styles.messageBubble, isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther]}>
          <ThemedText style={[styles.messageText, { color: appColors.textPrimary }, isOwn && styles.messageTextOwn]}>
            {item.content}
          </ThemedText>
        </View>

        {showTimestamp && (
          <ThemedText style={[styles.messageTimestamp, { color: appColors.textSecondary }]}>
            {formatRelativeTime(item.created_at)}
          </ThemedText>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: appColors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: appColors.surface, borderBottomColor: appColors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={appColors.textPrimary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerUser} onPress={handleUserPress}>
            {otherUser?.avatar_url ? (
              <Image source={{ uri: otherUser.avatar_url }} style={styles.headerAvatar} />
            ) : (
              <View style={[styles.headerAvatar, styles.headerAvatarPlaceholder]}>
                <ThemedText style={styles.headerAvatarText}>
                  {otherUser?.first_name?.[0]}{otherUser?.last_name?.[0]}
                </ThemedText>
              </View>
            )}
            <View style={styles.headerInfo}>
              <View style={styles.headerNameRow}>
                <ThemedText style={[styles.headerName, { color: appColors.textPrimary }]} numberOfLines={1}>
                  {otherUser?.full_name}
                </ThemedText>
                {otherUser?.is_verified && (
                  <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                )}
              </View>
              {otherUser?.specialty && (
                <ThemedText style={[styles.headerSpecialty, { color: appColors.textSecondary }]} numberOfLines={1}>
                  {otherUser.specialty}
                </ThemedText>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.callButton} onPress={handleVoiceCall}>
            <Ionicons name="call-outline" size={22} color={Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.callButton} onPress={handleVideoCall}>
            <Ionicons name="videocam-outline" size={22} color={Colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color={appColors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText style={[styles.emptyText, { color: appColors.textSecondary }]}>
                Start your conversation with {otherUser?.first_name}
              </ThemedText>
            </View>
          }
        />

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: appColors.surface, borderTopColor: appColors.border }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, { color: appColors.textPrimary }]}
              placeholder="Type a message..."
              placeholderTextColor={appColors.textSecondary}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="add-circle-outline" size={24} color={appColors.textSecondary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
          >
            {sendMessageMutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.xs,
  },
  headerUser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.md,
  },
  headerAvatarPlaceholder: {
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerName: {
    ...Typography.body,
    fontWeight: '600',
  },
  headerSpecialty: {
    ...Typography.small,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  moreButton: {
    padding: Spacing.sm,
  },
  messagesList: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.sm,
  },
  messageContainerOwn: {
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: Spacing.sm,
  },
  messageAvatarPlaceholder: {
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageAvatarText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
  },
  messageAvatarSpacer: {
    width: 28,
    marginRight: Spacing.sm,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  messageBubbleOwn: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    ...Typography.body,
  },
  messageTextOwn: {
    color: 'white',
  },
  messageTimestamp: {
    ...Typography.small,
    marginLeft: Spacing.sm,
    marginBottom: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['5xl'],
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    maxHeight: 100,
    paddingVertical: 0,
  },
  attachButton: {
    marginLeft: Spacing.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
