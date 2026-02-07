/**
 * AI Chat Screen
 * AI-powered healthcare investment assistant
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { aiApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatRelativeTime } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface SuggestedPrompt {
  icon: string;
  text: string;
  query: string;
}

const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    icon: '📊',
    text: 'Market Analysis',
    query: 'What are the current trends in healthcare investment?',
  },
  {
    icon: '💊',
    text: 'Drug Pipeline',
    query: 'Explain how to evaluate a biotech company\'s drug pipeline',
  },
  {
    icon: '🏥',
    text: 'MedTech',
    query: 'What makes a medical device startup investment-worthy?',
  },
  {
    icon: '📈',
    text: 'Due Diligence',
    query: 'What are the key factors for healthcare startup due diligence?',
  },
  {
    icon: '🧬',
    text: 'Genomics',
    query: 'What\'s the investment outlook for genomics companies?',
  },
  {
    icon: '💡',
    text: 'Digital Health',
    query: 'How do I evaluate digital health investments?',
  },
];

export default function AIChatScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const appColors = useAppColors();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTypingAnimation] = useState(new Animated.Value(0));

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Add typing indicator
      const typingMessage: Message = {
        id: 'typing',
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isTyping: true,
      };
      setMessages((prev) => [...prev, typingMessage]);

      // Call AI API
      const response = await aiApi.chat(content, messages.map(m => ({
        role: m.role,
        content: m.content,
      })));

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to get response');
      }

      return response.data?.response || 'I apologize, but I couldn\'t generate a response.';
    },
    onSuccess: (responseText) => {
      // Remove typing indicator and add response
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== 'typing');
        return [
          ...filtered,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: responseText,
            timestamp: new Date(),
          },
        ];
      });
    },
    onError: (error) => {
      // Remove typing indicator and show error
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== 'typing');
        return [
          ...filtered,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: 'I apologize, but I encountered an error. Please try again.',
            timestamp: new Date(),
          },
        ];
      });
    },
  });

  // Typing animation
  useEffect(() => {
    if (sendMessageMutation.isPending) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(isTypingAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(isTypingAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      isTypingAnimation.setValue(0);
    }
  }, [sendMessageMutation.isPending]);

  // Scroll to bottom when new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed || sendMessageMutation.isPending) return;
    setInputText('');
    sendMessageMutation.mutate(trimmed);
  }, [inputText, sendMessageMutation]);

  const handlePromptPress = useCallback((query: string) => {
    setInputText(query);
    inputRef.current?.focus();
  }, []);

  const handleClearChat = useCallback(() => {
    setMessages([]);
  }, []);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';

    if (item.isTyping) {
      return (
        <View style={[styles.messageContainer, styles.assistantMessage]}>
          <View style={styles.assistantAvatar}>
            <MaterialCommunityIcons name="robot" size={20} color={Colors.primary} />
          </View>
          <View style={[styles.typingIndicator, { backgroundColor: appColors.surface }]}>
            <Animated.View
              style={[
                styles.typingDot,
                {
                  opacity: isTypingAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.typingDot,
                {
                  opacity: isTypingAnimation.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.3, 1, 0.3],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.typingDot,
                {
                  opacity: isTypingAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.3],
                  }),
                },
              ]}
            />
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.assistantMessage]}>
        {!isUser && (
          <View style={styles.assistantAvatar}>
            <MaterialCommunityIcons name="robot" size={20} color={Colors.primary} />
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : [styles.assistantBubble, { backgroundColor: appColors.surface }]]}>
          <ThemedText style={[styles.messageText, { color: appColors.textPrimary }, isUser && styles.userMessageText]}>
            {item.content}
          </ThemedText>
          <ThemedText style={[styles.messageTime, { color: appColors.textSecondary }, isUser && styles.userMessageTime]}>
            {formatRelativeTime(item.timestamp.toISOString())}
          </ThemedText>
        </View>
        {isUser && (
          user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.userAvatar} />
          ) : (
            <View style={[styles.userAvatar, styles.userAvatarPlaceholder]}>
              <ThemedText style={styles.userAvatarText}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </ThemedText>
            </View>
          )
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      {/* AI Avatar */}
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.aiAvatarLarge}
      >
        <MaterialCommunityIcons name="robot" size={48} color="white" />
      </LinearGradient>

      <ThemedText style={[styles.emptyTitle, { color: appColors.textPrimary }]}>MedInvest AI Assistant</ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: appColors.textSecondary }]}>
        I'm here to help you with healthcare investment insights, market analysis, and due diligence questions.
      </ThemedText>

      {/* Suggested Prompts */}
      <View style={styles.promptsContainer}>
        <ThemedText style={[styles.promptsTitle, { color: appColors.textSecondary }]}>Try asking about:</ThemedText>
        <View style={styles.promptsGrid}>
          {SUGGESTED_PROMPTS.map((prompt, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.promptCard, { backgroundColor: appColors.surface }]}
              onPress={() => handlePromptPress(prompt.query)}
            >
              <ThemedText style={styles.promptIcon}>{prompt.icon}</ThemedText>
              <ThemedText style={[styles.promptText, { color: appColors.textPrimary }]}>{prompt.text}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimerContainer}>
        <Ionicons name="information-circle-outline" size={16} color={appColors.textSecondary} />
        <ThemedText style={[styles.disclaimerText, { color: appColors.textSecondary }]}>
          AI responses are for informational purposes only. Always consult with qualified professionals for investment decisions.
        </ThemedText>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: appColors.surface, borderBottomColor: appColors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={appColors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.headerAvatar}>
              <MaterialCommunityIcons name="robot" size={20} color={Colors.primary} />
            </View>
            <View>
              <ThemedText style={[styles.headerTitle, { color: appColors.textPrimary }]}>AI Assistant</ThemedText>
              <ThemedText style={[styles.headerSubtitle, { color: appColors.textSecondary }]}>Powered by MedInvest AI</ThemedText>
            </View>
          </View>
          {messages.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClearChat}>
              <Ionicons name="trash-outline" size={20} color={appColors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.messagesList,
            messages.length === 0 && styles.messagesListEmpty,
          ]}
          showsVerticalScrollIndicator={false}
        />

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: appColors.surface, borderTopColor: appColors.border }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: appColors.textPrimary }]}
              placeholder="Ask about healthcare investments..."
              placeholderTextColor={appColors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={2000}
              editable={!sendMessageMutation.isPending}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || sendMessageMutation.isPending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sendMessageMutation.isPending}
          >
            <LinearGradient
              colors={inputText.trim() && !sendMessageMutation.isPending ? [Colors.primary, Colors.secondary] : [appColors.border, appColors.border]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendButtonGradient}
            >
              <Ionicons name="send" size={20} color="white" />
            </LinearGradient>
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
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  headerTitle: {
    ...Typography.body,
    fontWeight: '600',
  },
  headerSubtitle: {
    ...Typography.small,
  },
  clearButton: {
    padding: Spacing.sm,
  },
  messagesList: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  messagesListEmpty: {
    flex: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  assistantMessage: {
    justifyContent: 'flex-start',
  },
  assistantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: Spacing.sm,
  },
  userAvatarPlaceholder: {
    backgroundColor: Colors.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    ...Typography.small,
    color: Colors.secondary,
    fontWeight: '600',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
    ...Shadows.card,
  },
  messageText: {
    ...Typography.body,
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  messageTime: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  userMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.card,
    gap: 6,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  aiAvatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.title,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  promptsContainer: {
    width: '100%',
  },
  promptsTitle: {
    ...Typography.caption,
    fontWeight: '600',
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  promptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  promptCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
    gap: Spacing.sm,
  },
  promptIcon: {
    fontSize: 20,
  },
  promptText: {
    ...Typography.caption,
    fontWeight: '500',
    flex: 1,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.light.backgroundSecondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  disclaimerText: {
    ...Typography.small,
    flex: 1,
    lineHeight: 18,
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
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxHeight: 120,
  },
  input: {
    ...Typography.body,
    maxHeight: 100,
  },
  sendButton: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
