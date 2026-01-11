/**
 * People You May Know Component
 * Suggested users to follow based on specialty, location, connections
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { usersApi } from '@/lib/api';

interface SuggestedUser {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url?: string;
  specialty?: string;
  location?: string;
  mutual_connections?: number;
  reason?: string; // "Same specialty", "In your network", etc.
}

interface PeopleYouMayKnowProps {
  limit?: number;
  horizontal?: boolean;
  showHeader?: boolean;
  onViewAll?: () => void;
}

export default function PeopleYouMayKnow({
  limit = 6,
  horizontal = false,
  showHeader = true,
  onViewAll,
}: PeopleYouMayKnowProps) {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  // Fetch suggested users
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['suggestedUsers', limit],
    queryFn: async () => {
      const response = await usersApi.getSuggestedUsers(limit);
      return response.data?.users || [];
    },
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await usersApi.follow(userId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to follow');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestedUsers'] });
    },
  });

  const handleUserPress = useCallback((userId: number) => {
    navigation.navigate('UserProfile', { userId });
  }, [navigation]);

  const handleFollow = useCallback((userId: number) => {
    followMutation.mutate(userId);
  }, [followMutation]);

  const handleViewAll = useCallback(() => {
    if (onViewAll) {
      onViewAll();
    } else {
      navigation.navigate('Discover', { tab: 'people' });
    }
  }, [onViewAll, navigation]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const renderUserCard = ({ item }: { item: SuggestedUser }) => (
    <SuggestedUserCard
      user={item}
      onPress={() => handleUserPress(item.id)}
      onFollow={() => handleFollow(item.id)}
      isFollowing={followMutation.isPending && followMutation.variables === item.id}
      horizontal={horizontal}
    />
  );

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>People you may know</ThemedText>
          <TouchableOpacity onPress={handleViewAll}>
            <ThemedText style={styles.viewAllText}>View all</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {horizontal ? (
        <FlatList
          data={suggestions}
          renderItem={renderUserCard}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      ) : (
        <View style={styles.verticalList}>
          {suggestions.map((user: SuggestedUser) => (
            <SuggestedUserCard
              key={user.id}
              user={user}
              onPress={() => handleUserPress(user.id)}
              onFollow={() => handleFollow(user.id)}
              isFollowing={followMutation.isPending && followMutation.variables === user.id}
              horizontal={false}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// Individual user card component
interface SuggestedUserCardProps {
  user: SuggestedUser;
  onPress: () => void;
  onFollow: () => void;
  isFollowing: boolean;
  horizontal: boolean;
}

function SuggestedUserCard({ 
  user, 
  onPress, 
  onFollow, 
  isFollowing,
  horizontal 
}: SuggestedUserCardProps) {
  const [followed, setFollowed] = useState(false);

  const handleFollow = () => {
    setFollowed(true);
    onFollow();
  };

  if (horizontal) {
    // Horizontal card layout (for carousels)
    return (
      <TouchableOpacity style={styles.horizontalCard} onPress={onPress}>
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.horizontalAvatar} />
        ) : (
          <View style={[styles.horizontalAvatar, styles.avatarPlaceholder]}>
            <ThemedText style={styles.avatarText}>
              {user.first_name[0]}{user.last_name[0]}
            </ThemedText>
          </View>
        )}
        <ThemedText style={styles.horizontalName} numberOfLines={1}>
          {user.full_name}
        </ThemedText>
        {user.specialty && (
          <ThemedText style={styles.horizontalSpecialty} numberOfLines={1}>
            {user.specialty}
          </ThemedText>
        )}
        <TouchableOpacity
          style={[styles.followButtonSmall, followed && styles.followedButton]}
          onPress={handleFollow}
          disabled={isFollowing || followed}
        >
          {isFollowing ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <ThemedText style={[styles.followButtonTextSmall, followed && styles.followedButtonText]}>
              {followed ? 'Following' : 'Follow'}
            </ThemedText>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  // Vertical list item layout (matching the screenshot)
  return (
    <View style={styles.listItem}>
      <TouchableOpacity style={styles.listItemContent} onPress={onPress}>
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.listAvatar} />
        ) : (
          <View style={[styles.listAvatar, styles.avatarPlaceholder]}>
            <ThemedText style={styles.avatarTextSmall}>
              {user.first_name[0]}{user.last_name[0]}
            </ThemedText>
          </View>
        )}
        <View style={styles.listUserInfo}>
          <ThemedText style={styles.listUserName}>{user.full_name}</ThemedText>
          <ThemedText style={styles.listUserMeta}>
            {user.specialty}{user.location ? ` · ${user.location}` : ''}
          </ThemedText>
          {user.mutual_connections && user.mutual_connections > 0 && (
            <ThemedText style={styles.mutualConnections}>
              {user.mutual_connections} mutual connection{user.mutual_connections > 1 ? 's' : ''}
            </ThemedText>
          )}
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.followButton, followed && styles.followedButton]}
        onPress={handleFollow}
        disabled={isFollowing || followed}
      >
        {isFollowing ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : followed ? (
          <Ionicons name="checkmark" size={18} color={Colors.textSecondary} />
        ) : (
          <Ionicons name="person-add-outline" size={18} color={Colors.primary} />
        )}
      </TouchableOpacity>
    </View>
  );
}

// Compact inline version for sidebars
export function PeopleYouMayKnowCompact({ limit = 3 }: { limit?: number }) {
  return (
    <View style={styles.compactContainer}>
      <PeopleYouMayKnow 
        limit={limit} 
        horizontal={false} 
        showHeader={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  viewAllText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  
  // Horizontal list
  horizontalList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  horizontalCard: {
    width: 140,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  horizontalAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: Spacing.sm,
  },
  horizontalName: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  horizontalSpecialty: {
    ...Typography.small,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  followButtonSmall: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    minWidth: 80,
    alignItems: 'center',
  },
  followButtonTextSmall: {
    ...Typography.small,
    color: 'white',
    fontWeight: '600',
  },

  // Vertical list
  verticalList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  listItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  listAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: Spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  avatarTextSmall: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  listUserInfo: {
    flex: 1,
  },
  listUserName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
  },
  listUserMeta: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  mutualConnections: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  followButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followedButton: {
    backgroundColor: Colors.light.backgroundTertiary,
  },
  followedButtonText: {
    color: Colors.textSecondary,
  },

  // Compact container
  compactContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.card,
  },
});
