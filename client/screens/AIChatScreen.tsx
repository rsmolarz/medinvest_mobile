import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows, Typography } from "@/constants/theme";

function getApiUrl() {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) {
    return `https://${domain}`;
  }
  return "http://localhost:5000";
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

const SUGGESTED_PROMPTS = [
  "What are the key trends in healthcare investment?",
  "How do I evaluate a biotech startup?",
  "Explain clinical trial phases for investors",
  "What makes a good healthcare investment opportunity?",
];

export default function AIChatScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const createConversation = useCallback(async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });
      const data = await response.json();
      setConversationId(data.id);
      return data.id;
    } catch (error) {
      console.error("Failed to create conversation:", error);
      return null;
    }
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    Platform.OS !== "web" && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    let currentConversationId = conversationId;
    if (!currentConversationId) {
      currentConversationId = await createConversation();
      if (!currentConversationId) {
        setIsLoading(false);
        return;
      }
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      isStreaming: true,
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch(
        `${getApiUrl()}/api/conversations/${currentConversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text.trim() }),
        }
      );

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  fullContent += data.content;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessage.id
                        ? { ...msg, content: fullContent }
                        : msg
                    )
                  );
                }
                if (data.done) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessage.id
                        ? { ...msg, isStreaming: false }
                        : msg
                    )
                  );
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, content: "Sorry, I encountered an error. Please try again.", isStreaming: false }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, isLoading, createConversation]);

  const handleSuggestedPrompt = useCallback((prompt: string) => {
    sendMessage(prompt);
  }, [sendMessage]);

  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isUser = item.role === "user";
      return (
        <Animated.View
          entering={FadeInUp.delay(index * 50).springify()}
          style={[
            styles.messageContainer,
            isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
          ]}
        >
          {isUser ? (
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.userMessageBubble}
            >
              <ThemedText type="body" style={styles.userMessageText}>
                {item.content}
              </ThemedText>
            </LinearGradient>
          ) : (
            <View style={[styles.assistantMessageBubble, { backgroundColor: theme.backgroundSecondary }]}>
              <View style={styles.assistantHeader}>
                <View style={styles.aiIcon}>
                  <Feather name="cpu" size={14} color={Colors.primary} />
                </View>
                <ThemedText type="small" style={{ color: Colors.primary, fontWeight: "600" }}>
                  MedInvest AI
                </ThemedText>
              </View>
              <ThemedText type="body" style={{ color: theme.text }}>
                {item.content}
                {item.isStreaming ? "▋" : ""}
              </ThemedText>
            </View>
          )}
        </Animated.View>
      );
    },
    [theme]
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.aiIconLarge, { backgroundColor: Colors.primary + "15" }]}>
        <Feather name="cpu" size={40} color={Colors.primary} />
      </View>
      <ThemedText type="title" style={{ textAlign: "center", marginTop: Spacing.lg }}>
        MedInvest AI Assistant
      </ThemedText>
      <ThemedText
        type="body"
        style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}
      >
        Your personal guide to healthcare investments. Ask me anything about medical innovations,
        due diligence, or investment strategies.
      </ThemedText>

      <View style={styles.suggestedPromptsContainer}>
        <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
          Try asking:
        </ThemedText>
        {SUGGESTED_PROMPTS.map((prompt, index) => (
          <Pressable
            key={index}
            style={[styles.suggestedPrompt, { backgroundColor: theme.backgroundSecondary }]}
            onPress={() => handleSuggestedPrompt(prompt)}
          >
            <Feather name="message-circle" size={16} color={Colors.primary} />
            <ThemedText type="body" style={{ flex: 1, marginLeft: Spacing.sm }}>
              {prompt}
            </ThemedText>
            <Feather name="arrow-right" size={16} color={theme.textSecondary} />
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.messagesList,
          { paddingTop: insets.top + Spacing.lg, paddingBottom: 100 },
        ]}
        ListEmptyComponent={renderEmptyState}
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }}
      />

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.backgroundDefault,
            paddingBottom: insets.bottom + Spacing.sm,
            borderTopColor: Colors.border,
          },
        ]}
      >
        <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundSecondary }]}>
          <TextInput
            style={[styles.textInput, { color: theme.text }]}
            placeholder="Ask about healthcare investments..."
            placeholderTextColor={theme.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            editable={!isLoading}
          />
          <Pressable
            style={[
              styles.sendButton,
              {
                backgroundColor: inputText.trim() && !isLoading ? Colors.primary : theme.textSecondary + "40",
              },
            ]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="send" size={18} color="#fff" />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: Spacing.md,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: 60,
  },
  aiIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  suggestedPromptsContainer: {
    width: "100%",
    marginTop: Spacing.xl,
  },
  suggestedPrompt: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  messageContainer: {
    marginBottom: Spacing.md,
    maxWidth: "85%",
  },
  userMessageContainer: {
    alignSelf: "flex-end",
  },
  assistantMessageContainer: {
    alignSelf: "flex-start",
  },
  userMessageBubble: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.sm,
  },
  userMessageText: {
    color: "#fff",
  },
  assistantMessageBubble: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.sm,
  },
  assistantHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  aiIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.xs,
  },
  inputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: BorderRadius.xl,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.xs,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: Typography.body.fontSize,
    maxHeight: 100,
    paddingVertical: Platform.OS === "ios" ? Spacing.sm : Spacing.xs,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: Spacing.xs,
  },
});
