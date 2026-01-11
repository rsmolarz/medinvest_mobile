import React from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { conversations, Conversation } from "@/lib/mockData";

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();

  const renderConversation = ({ item, index }: { item: Conversation; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <Pressable
        style={({ pressed }) => [
          styles.conversationItem,
          { backgroundColor: theme.backgroundDefault },
          Shadows.card,
          pressed && { opacity: 0.9 },
        ]}
      >
        <LinearGradient
          colors={[Colors.gradient.start, Colors.gradient.end]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <ThemedText type="heading" style={{ color: "#FFFFFF" }}>
            {item.name.charAt(0)}
          </ThemedText>
        </LinearGradient>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <ThemedText type="heading" numberOfLines={1} style={{ flex: 1 }}>
              {item.name}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {item.timestamp}
            </ThemedText>
          </View>
          <ThemedText
            type="body"
            numberOfLines={1}
            style={{ color: theme.textSecondary }}
          >
            {item.lastMessage}
          </ThemedText>
        </View>

        {item.unreadCount > 0 ? (
          <View style={styles.unreadBadge}>
            <ThemedText type="small" style={{ color: "#FFFFFF", fontWeight: "600" }}>
              {item.unreadCount}
            </ThemedText>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText type="title">Messages</ThemedText>
        <Pressable hitSlop={8} style={styles.composeButton}>
          <Feather name="edit" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="message-circle" size={48} color={theme.textSecondary} />
            <ThemedText type="heading" style={{ marginTop: Spacing.lg }}>
              No Messages Yet
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
              Start a conversation with other investors
            </ThemedText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  composeButton: {
    padding: Spacing.sm,
  },
  list: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  conversationContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  conversationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 100,
    paddingHorizontal: Spacing.xl,
  },
});
