import React, { useState } from "react";
import { View, StyleSheet, FlatList, Pressable, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { healthcareRooms, HealthcareRoom } from "@/lib/mockData";

export default function RoomsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [joinedRooms, setJoinedRooms] = useState<Set<string>>(new Set(["cardiology", "oncology"]));

  const filteredRooms = healthcareRooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleJoinRoom = (roomId: string) => {
    setJoinedRooms((prev) => {
      const updated = new Set(prev);
      if (updated.has(roomId)) {
        updated.delete(roomId);
      } else {
        updated.add(roomId);
      }
      return updated;
    });
  };

  const renderRoom = ({ item, index }: { item: HealthcareRoom; index: number }) => {
    const isJoined = joinedRooms.has(item.id);

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
        <View style={[styles.roomCard, { backgroundColor: theme.backgroundDefault }, Shadows.card]}>
          <View style={[styles.roomIcon, { backgroundColor: item.color + "20" }]}>
            <Feather name={item.icon as any} size={24} color={item.color} />
          </View>

          <View style={styles.roomContent}>
            <ThemedText type="heading">{item.name}</ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              {item.specialty}
            </ThemedText>
            <View style={styles.memberRow}>
              <Feather name="users" size={14} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                {item.memberCount.toLocaleString()} members
              </ThemedText>
            </View>
          </View>

          <Pressable
            onPress={() => handleJoinRoom(item.id)}
            style={[
              styles.joinButton,
              {
                backgroundColor: isJoined ? theme.backgroundSecondary : Colors.primary,
              },
            ]}
          >
            <ThemedText
              type="body"
              style={{
                color: isJoined ? theme.textSecondary : "#FFFFFF",
                fontWeight: "600",
              }}
            >
              {isJoined ? "Joined" : "Join"}
            </ThemedText>
          </Pressable>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText type="title">Healthcare Rooms</ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
          Join specialty communities to discuss investments
        </ThemedText>
      </View>

      <View style={styles.searchSection}>
        <View style={[styles.searchContainer, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search specialties..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={filteredRooms}
        renderItem={renderRoom}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="search" size={48} color={theme.textSecondary} />
            <ThemedText type="heading" style={{ marginTop: Spacing.lg }}>
              No rooms found
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Try a different search term
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
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  searchSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.xs,
  },
  list: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  roomCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  roomIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  roomContent: {
    flex: 1,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  joinButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
  },
});
