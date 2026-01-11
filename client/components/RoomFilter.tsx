/**
 * RoomFilter Component
 * Horizontal scrollable list of room filters
 */

import React, { memo, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { Room } from '@/types';

interface RoomFilterProps {
  rooms: Room[];
  selectedRoom: string | null;
  onSelectRoom: (roomSlug: string | null) => void;
}

function RoomFilter({ rooms, selectedRoom, onSelectRoom }: RoomFilterProps) {
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSelectRoom = (slug: string | null) => {
    onSelectRoom(slug === selectedRoom ? null : slug);
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* All Rooms Option */}
        <TouchableOpacity
          style={[
            styles.roomChip,
            selectedRoom === null && styles.roomChipActive,
          ]}
          onPress={() => handleSelectRoom(null)}
        >
          <ThemedText style={styles.roomIcon}>🌐</ThemedText>
          <ThemedText
            style={[
              styles.roomName,
              selectedRoom === null && styles.roomNameActive,
            ]}
          >
            All
          </ThemedText>
        </TouchableOpacity>

        {/* Room Options */}
        {rooms.map((room) => (
          <TouchableOpacity
            key={room.slug}
            style={[
              styles.roomChip,
              selectedRoom === room.slug && styles.roomChipActive,
              selectedRoom === room.slug && { backgroundColor: room.color + '20' },
            ]}
            onPress={() => handleSelectRoom(room.slug)}
          >
            <ThemedText style={styles.roomIcon}>{room.icon}</ThemedText>
            <ThemedText
              style={[
                styles.roomName,
                selectedRoom === room.slug && styles.roomNameActive,
                selectedRoom === room.slug && { color: room.color },
              ]}
            >
              {room.name}
            </ThemedText>
            {room.posts_count > 0 && (
              <View style={[styles.countBadge, { backgroundColor: room.color + '30' }]}>
                <ThemedText style={[styles.countText, { color: room.color }]}>
                  {room.posts_count > 99 ? '99+' : room.posts_count}
                </ThemedText>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  roomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.backgroundSecondary,
    gap: Spacing.xs,
  },
  roomChipActive: {
    backgroundColor: Colors.primary + '15',
  },
  roomIcon: {
    fontSize: 14,
  },
  roomName: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  roomNameActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  countBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.xs,
  },
  countText: {
    ...Typography.small,
    fontWeight: '600',
  },
});

export default memo(RoomFilter);
