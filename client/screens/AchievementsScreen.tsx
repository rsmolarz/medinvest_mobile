import React from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { achievements, Achievement } from "@/lib/mockData";

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const earnedCount = achievements.filter((a) => a.earned).length;
  const totalPoints = achievements.filter((a) => a.earned).reduce((sum, a) => sum + a.points, 0);

  const renderAchievement = ({ item, index }: { item: Achievement; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <View
        style={[
          styles.achievementCard,
          { backgroundColor: theme.backgroundDefault },
          Shadows.card,
          !item.earned && styles.unearned,
        ]}
      >
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: item.earned ? Colors.primary + "15" : theme.backgroundSecondary,
            },
          ]}
        >
          <Feather
            name={item.icon as any}
            size={24}
            color={item.earned ? Colors.primary : theme.textSecondary}
          />
        </View>

        <View style={styles.achievementContent}>
          <ThemedText
            type="heading"
            style={{ color: item.earned ? theme.text : theme.textSecondary }}
          >
            {item.name}
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            {item.description}
          </ThemedText>
          {item.earnedAt ? (
            <ThemedText type="small" style={{ color: Colors.secondary, marginTop: Spacing.xs }}>
              Earned on {new Date(item.earnedAt).toLocaleDateString()}
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.pointsBadge}>
          <ThemedText
            type="heading"
            style={{ color: item.earned ? Colors.primary : theme.textSecondary }}
          >
            +{item.points}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            pts
          </ThemedText>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText type="title">Achievements</ThemedText>
      </View>

      <LinearGradient
        colors={[Colors.gradient.start, Colors.gradient.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.summaryCard}
      >
        <View style={styles.summaryItem}>
          <ThemedText type="hero" style={{ color: "#FFFFFF" }}>
            {earnedCount}
          </ThemedText>
          <ThemedText type="body" style={{ color: "rgba(255,255,255,0.8)" }}>
            Earned
          </ThemedText>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <ThemedText type="hero" style={{ color: "#FFFFFF" }}>
            {achievements.length - earnedCount}
          </ThemedText>
          <ThemedText type="body" style={{ color: "rgba(255,255,255,0.8)" }}>
            Remaining
          </ThemedText>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <ThemedText type="hero" style={{ color: "#FFFFFF" }}>
            {totalPoints}
          </ThemedText>
          <ThemedText type="body" style={{ color: "rgba(255,255,255,0.8)" }}>
            Points
          </ThemedText>
        </View>
      </LinearGradient>

      <FlatList
        data={achievements}
        renderItem={renderAchievement}
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
  summaryCard: {
    flexDirection: "row",
    marginHorizontal: Spacing.xl,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  list: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  achievementCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  unearned: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  achievementContent: {
    flex: 1,
  },
  pointsBadge: {
    alignItems: "center",
  },
});
