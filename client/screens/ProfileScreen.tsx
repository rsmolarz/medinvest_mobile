import React from "react";
import { View, StyleSheet, Pressable, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { menuItems } from "@/lib/mockData";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            await logout();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleMenuPress = (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText type="title">Profile</ThemedText>
        <Pressable hitSlop={8}>
          <Feather name="settings" size={22} color={theme.text} />
        </Pressable>
      </View>

      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <View style={styles.profileSection}>
          <LinearGradient
            colors={[Colors.gradient.start, Colors.gradient.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <ThemedText type="title" style={styles.avatarText}>
              {user?.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </ThemedText>
          </LinearGradient>

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <ThemedText type="title">{user?.name}</ThemedText>
              {user?.verified ? (
                <View style={styles.verifiedBadge}>
                  <Feather name="check" size={12} color="#FFFFFF" />
                </View>
              ) : null}
            </View>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              {user?.email}
            </ThemedText>
          </View>
        </View>

        <View
          style={[
            styles.statsCard,
            { backgroundColor: theme.backgroundDefault },
            Shadows.card,
          ]}
        >
          <View style={styles.statItem}>
            <ThemedText type="heading" style={{ color: Colors.primary }}>
              0
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Investments
            </ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.backgroundSecondary }]} />
          <View style={styles.statItem}>
            <ThemedText type="heading" style={{ color: Colors.secondary }}>
              $0
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Total Value
            </ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.backgroundSecondary }]} />
          <View style={styles.statItem}>
            <ThemedText type="heading" style={{ color: Colors.primary }}>
              0%
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Returns
            </ThemedText>
          </View>
        </View>

        <View style={styles.quickActions}>
          <Pressable
            onPress={() => navigation.navigate("Leaderboard")}
            style={({ pressed }) => [
              styles.quickActionButton,
              { backgroundColor: theme.backgroundDefault },
              Shadows.card,
              pressed && { opacity: 0.9 },
            ]}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: "#FFD700" + "20" }]}>
              <Feather name="award" size={22} color="#FFD700" />
            </View>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              Leaderboard
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("Achievements")}
            style={({ pressed }) => [
              styles.quickActionButton,
              { backgroundColor: theme.backgroundDefault },
              Shadows.card,
              pressed && { opacity: 0.9 },
            ]}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.secondary + "20" }]}>
              <Feather name="star" size={22} color={Colors.secondary} />
            </View>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              Achievements
            </ThemedText>
          </Pressable>
        </View>

        <Pressable
          onPress={() => navigation.navigate("AIChat")}
          style={({ pressed }) => [
            styles.aiChatButton,
            pressed && { opacity: 0.9 },
          ]}
        >
          <LinearGradient
            colors={[Colors.gradient.start, Colors.gradient.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiChatGradient}
          >
            <View style={styles.aiChatContent}>
              <View style={styles.aiChatIcon}>
                <Feather name="cpu" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.aiChatText}>
                <ThemedText type="heading" style={{ color: "#FFFFFF" }}>
                  AI Assistant
                </ThemedText>
                <ThemedText type="small" style={{ color: "rgba(255,255,255,0.8)" }}>
                  Get investment insights powered by AI
                </ThemedText>
              </View>
              <Feather name="arrow-right" size={20} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </Pressable>

        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => handleMenuPress(item.id)}
              style={({ pressed }) => [
                styles.menuItem,
                { backgroundColor: theme.backgroundDefault },
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={[styles.menuIcon, { backgroundColor: Colors.primary + "15" }]}>
                <Feather name={item.icon} size={20} color={Colors.primary} />
              </View>
              <ThemedText type="body" style={styles.menuTitle}>
                {item.title}
              </ThemedText>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            { backgroundColor: Colors.error + "10" },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Feather name="log-out" size={20} color={Colors.error} />
          <ThemedText type="body" style={{ color: Colors.error, fontWeight: "500" }}>
            Sign Out
          </ThemedText>
        </Pressable>

        <ThemedText
          type="small"
          style={[styles.version, { color: theme.textSecondary }]}
        >
          MedInvest v1.0.0
        </ThemedText>
      </KeyboardAwareScrollViewCompat>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  avatarText: {
    color: "#FFFFFF",
  },
  profileInfo: {
    alignItems: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  statsCard: {
    flexDirection: "row",
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xl,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
  },
  quickActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  quickActionButton: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  aiChatButton: {
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  aiChatGradient: {
    padding: Spacing.lg,
  },
  aiChatContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  aiChatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  aiChatText: {
    flex: 1,
  },
  menuSection: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTitle: {
    flex: 1,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  version: {
    textAlign: "center",
  },
});
