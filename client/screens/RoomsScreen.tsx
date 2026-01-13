import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable, TextInput, RefreshControl, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { roomsApi, Room } from "@/lib/api";

export default function RoomsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: roomsData, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['/api/rooms'],
  });

  const rooms = roomsData?.rooms || [];

  const joinMutation = useMutation({
    mutationFn: async ({ slug, isJoined }: { slug: string; isJoined: boolean }) => {
      if (isJoined) {
        return roomsApi.leaveRoom(slug);
      } else {
        return roomsApi.joinRoom(slug);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
    },
  });

  const filteredRooms = rooms.filter((room: Room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleJoinRoom = useCallback((slug: string, isJoined: boolean) => {
    joinMutation.mutate({ slug, isJoined });
  }, [joinMutation]);

  const handleRoomPress = useCallback((slug: string) => {
    navigation.navigate('RoomDetail', { roomSlug: slug });
  }, [navigation]);

  const renderRoom = ({ item, index }: { item: Room; index: number }) => {
    const isJoined = item.is_member;
    const iconName = getFeatherIconName(item.icon);

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
        <Pressable 
          style={[styles.roomCard, { backgroundColor: theme.backgroundDefault }, Shadows.card]}
          onPress={() => handleRoomPress(item.slug)}
        >
          <View style={[styles.roomIcon, { backgroundColor: item.color + "20" }]}>
            <Feather name={iconName} size={24} color={item.color} />
          </View>

          <View style={styles.roomContent}>
            <ThemedText type="heading">{item.name}</ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary }} numberOfLines={1}>
              {item.description}
            </ThemedText>
            <View style={styles.statsRow}>
              <View style={styles.memberRow}>
                <Feather name="users" size={14} color={theme.textSecondary} />
                <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                  {item.members_count?.toLocaleString() || 0} members
                </ThemedText>
              </View>
              <View style={styles.memberRow}>
                <Feather name="message-square" size={14} color={theme.textSecondary} />
                <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                  {item.posts_count?.toLocaleString() || 0} posts
                </ThemedText>
              </View>
            </View>
          </View>

          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              handleJoinRoom(item.slug, isJoined);
            }}
            style={[
              styles.joinButton,
              {
                backgroundColor: isJoined ? theme.backgroundSecondary : Colors.primary,
              },
            ]}
            disabled={joinMutation.isPending}
          >
            {joinMutation.isPending && joinMutation.variables?.slug === item.slug ? (
              <ActivityIndicator size="small" color={isJoined ? theme.textSecondary : "#FFFFFF"} />
            ) : (
              <ThemedText
                type="body"
                style={{
                  color: isJoined ? theme.textSecondary : "#FFFFFF",
                  fontWeight: "600",
                }}
              >
                {isJoined ? "Joined" : "Join"}
              </ThemedText>
            )}
          </Pressable>
        </Pressable>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

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
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
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

function getFeatherIconName(icon: string): keyof typeof Feather.glyphMap {
  const iconMap: Record<string, keyof typeof Feather.glyphMap> = {
    heart: 'heart',
    activity: 'activity',
    cpu: 'cpu',
    smartphone: 'smartphone',
    'flask-conical': 'droplet',
    stethoscope: 'thermometer',
    pill: 'disc',
    brain: 'zap',
  };
  return iconMap[icon] || 'folder';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: Spacing.sm,
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
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
    gap: Spacing.md,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  joinButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    minWidth: 80,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
  },
});
