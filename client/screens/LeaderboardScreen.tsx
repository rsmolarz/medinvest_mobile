import React, { useState } from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { leaderboardUsers, LeaderboardUser } from "@/lib/mockData";

type TimeFilter = "weekly" | "monthly" | "allTime";

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("weekly");

  const topThree = leaderboardUsers.slice(0, 3);
  const restOfList = leaderboardUsers.slice(3);

  const renderPodiumUser = (user: LeaderboardUser, position: 1 | 2 | 3) => {
    const heights = { 1: 120, 2: 100, 3: 80 };
    const colors = {
      1: ["#FFD700", "#FFA500"] as const,
      2: ["#C0C0C0", "#A8A8A8"] as const,
      3: ["#CD7F32", "#8B4513"] as const,
    };

    return (
      <Animated.View
        entering={FadeInUp.delay(position * 100).springify()}
        style={styles.podiumColumn}
      >
        <LinearGradient
          colors={[Colors.gradient.start, Colors.gradient.end]}
          style={styles.podiumAvatar}
        >
          <ThemedText type="heading" style={{ color: "#FFFFFF" }}>
            {user.name.charAt(0)}
          </ThemedText>
        </LinearGradient>
        <ThemedText type="body" style={{ fontWeight: "600", marginTop: Spacing.sm }} numberOfLines={1}>
          {user.name.split(" ")[0]}
        </ThemedText>
        <ThemedText type="small" style={{ color: Colors.primary }}>
          {user.points.toLocaleString()} pts
        </ThemedText>
        <LinearGradient
          colors={colors[position]}
          style={[styles.podiumBase, { height: heights[position] }]}
        >
          <ThemedText type="title" style={{ color: "#FFFFFF" }}>
            {position}
          </ThemedText>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderUser = ({ item, index }: { item: LeaderboardUser; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <View style={[styles.userRow, { backgroundColor: theme.backgroundDefault }, Shadows.card]}>
        <ThemedText type="heading" style={styles.rank}>
          {item.rank}
        </ThemedText>
        <LinearGradient
          colors={[Colors.gradient.start, Colors.gradient.end]}
          style={styles.smallAvatar}
        >
          <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
            {item.name.charAt(0)}
          </ThemedText>
        </LinearGradient>
        <View style={styles.userInfo}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            {item.name}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Level {item.level}
          </ThemedText>
        </View>
        <ThemedText type="heading" style={{ color: Colors.primary }}>
          {item.points.toLocaleString()}
        </ThemedText>
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText type="title">Leaderboard</ThemedText>
      </View>

      <View style={styles.filterContainer}>
        {(["weekly", "monthly", "allTime"] as TimeFilter[]).map((filter) => (
          <Pressable
            key={filter}
            onPress={() => setTimeFilter(filter)}
            style={[
              styles.filterButton,
              timeFilter === filter && { backgroundColor: Colors.primary },
            ]}
          >
            <ThemedText
              type="body"
              style={{
                color: timeFilter === filter ? "#FFFFFF" : theme.textSecondary,
                fontWeight: timeFilter === filter ? "600" : "400",
              }}
            >
              {filter === "allTime" ? "All Time" : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <View style={styles.podiumContainer}>
        {topThree[1] ? renderPodiumUser(topThree[1], 2) : null}
        {topThree[0] ? renderPodiumUser(topThree[0], 1) : null}
        {topThree[2] ? renderPodiumUser(topThree[2], 3) : null}
      </View>

      <FlatList
        data={restOfList}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: "transparent",
  },
  podiumContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  podiumColumn: {
    alignItems: "center",
    width: 90,
  },
  podiumAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  podiumBase: {
    width: 80,
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
  },
  list: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  rank: {
    width: 30,
    textAlign: "center",
  },
  smallAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
  },
});
