/**
 * Search Screen
 * Search posts, users, rooms, and hashtags
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { searchApi, feedApi } from '@/lib/api';
import { SearchType, Post, User, Room, TrendingTopic } from '@/types';
import { formatNumber, debounce } from '@/lib/utils';
import PostCard from '@/components/PostCard';

type TabType = 'top' | 'posts' | 'users' | 'rooms' | 'tags';

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const inputRef = useRef<TextInput>(null);
  
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('top');
  const [searchQuery, setSearchQuery] = useState('');

  // Debounced search
  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
    }, 300),
    []
  );

  const handleQueryChange = (text: string) => {
    setQuery(text);
    debouncedSetSearch(text);
  };

  // Trending topics for empty state
  const { data: trendingData } = useQuery({
    queryKey: ['trending'],
    queryFn: async () => {
      const response = await feedApi.getTrending();
      return response.data?.topics || [];
    },
    enabled: !searchQuery,
  });

  // Search results
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', searchQuery, activeTab],
    queryFn: async () => {
      const type = activeTab === 'top' ? 'all' : activeTab as SearchType;
      const response = await searchApi.search(searchQuery, type);
      return response.data;
    },
    enabled: searchQuery.length > 0,
  });

  const handleUserPress = useCallback((userId: number) => {
    navigation.navigate('UserProfile', { userId });
  }, [navigation]);

  const handlePostPress = useCallback((postId: number) => {
    navigation.navigate('PostDetail', { postId });
  }, [navigation]);

  const handleRoomPress = useCallback((roomSlug: string) => {
    navigation.navigate('RoomDetail', { roomSlug });
  }, [navigation]);

  const handleHashtagPress = useCallback((tag: string) => {
    navigation.navigate('Hashtag', { tag });
  }, [navigation]);

  const handleClear = () => {
    setQuery('');
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      {(['top', 'posts', 'users', 'rooms', 'tags'] as TabType[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.tabActive]}
          onPress={() => setActiveTab(tab)}
        >
          <ThemedText style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.userItem} onPress={() => handleUserPress(item.id)}>
      {item.avatar_url ? (
        <Image source={{ uri: item.avatar_url }} style={styles.userAvatar} />
      ) : (
        <View style={[styles.userAvatar, styles.userAvatarPlaceholder]}>
          <ThemedText style={styles.userAvatarText}>
            {item.first_name[0]}{item.last_name[0]}
          </ThemedText>
        </View>
      )}
      <View style={styles.userInfo}>
        <View style={styles.userNameRow}>
          <ThemedText style={styles.userName}>{item.full_name}</ThemedText>
          {item.is_verified && (
            <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
          )}
        </View>
        {item.specialty && (
          <ThemedText style={styles.userSpecialty}>{item.specialty}</ThemedText>
        )}
        <ThemedText style={styles.userFollowers}>
          {formatNumber(item.followers_count)} followers
        </ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderRoomItem = ({ item }: { item: Room }) => (
    <TouchableOpacity style={styles.roomItem} onPress={() => handleRoomPress(item.slug)}>
      <View style={[styles.roomIcon, { backgroundColor: item.color + '20' }]}>
        <ThemedText style={styles.roomEmoji}>{item.icon}</ThemedText>
      </View>
      <View style={styles.roomInfo}>
        <ThemedText style={styles.roomName}>{item.name}</ThemedText>
        <ThemedText style={styles.roomDescription} numberOfLines={1}>
          {item.description}
        </ThemedText>
        <ThemedText style={styles.roomMembers}>
          {formatNumber(item.members_count)} members · {formatNumber(item.posts_count)} posts
        </ThemedText>
      </View>
      {!item.is_member && (
        <TouchableOpacity style={styles.joinButton}>
          <ThemedText style={styles.joinButtonText}>Join</ThemedText>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderHashtagItem = ({ item }: { item: TrendingTopic }) => (
    <TouchableOpacity style={styles.hashtagItem} onPress={() => handleHashtagPress(item.hashtag)}>
      <View style={styles.hashtagIcon}>
        <ThemedText style={styles.hashtagSymbol}>#</ThemedText>
      </View>
      <View style={styles.hashtagInfo}>
        <ThemedText style={styles.hashtagName}>{item.hashtag}</ThemedText>
        <ThemedText style={styles.hashtagCount}>
          {formatNumber(item.count)} posts
        </ThemedText>
      </View>
      <Ionicons 
        name={item.trend === 'up' ? 'trending-up' : item.trend === 'down' ? 'trending-down' : 'remove'} 
        size={20} 
        color={item.trend === 'up' ? Colors.secondary : item.trend === 'down' ? Colors.error : Colors.textSecondary} 
      />
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (!searchQuery) {
      // Show trending topics
      return (
        <View style={styles.trendingContainer}>
          <ThemedText style={styles.trendingTitle}>Trending Topics</ThemedText>
          {trendingData?.map((topic, index) => (
            <TouchableOpacity
              key={topic.hashtag}
              style={styles.trendingItem}
              onPress={() => handleHashtagPress(topic.hashtag)}
            >
              <ThemedText style={styles.trendingRank}>{index + 1}</ThemedText>
              <View style={styles.trendingInfo}>
                <ThemedText style={styles.trendingTag}>#{topic.hashtag}</ThemedText>
                <ThemedText style={styles.trendingCount}>
                  {formatNumber(topic.count)} posts
                </ThemedText>
              </View>
              <Ionicons 
                name={topic.trend === 'up' ? 'trending-up' : 'trending-down'} 
                size={18} 
                color={topic.trend === 'up' ? Colors.secondary : Colors.error} 
              />
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }

    // Render based on active tab
    switch (activeTab) {
      case 'users':
        return (
          <FlatList
            data={searchResults?.users || []}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>No users found</ThemedText>
              </View>
            }
          />
        );
      case 'rooms':
        return (
          <FlatList
            data={searchResults?.rooms || []}
            renderItem={renderRoomItem}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>No rooms found</ThemedText>
              </View>
            }
          />
        );
      case 'tags':
        return (
          <FlatList
            data={searchResults?.hashtags || []}
            renderItem={renderHashtagItem}
            keyExtractor={(item) => item.hashtag}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>No hashtags found</ThemedText>
              </View>
            }
          />
        );
      case 'posts':
      case 'top':
      default:
        return (
          <FlatList
            data={searchResults?.posts || []}
            renderItem={({ item }) => (
              <PostCard
                post={item}
                onPress={() => handlePostPress(item.id)}
                onUserPress={() => handleUserPress(item.author.id)}
                onVote={() => {}}
                onBookmark={() => {}}
                onHashtagPress={handleHashtagPress}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>No posts found</ThemedText>
              </View>
            }
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search MedInvest..."
            placeholderTextColor={Colors.textSecondary}
            value={query}
            onChangeText={handleQueryChange}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs (only show when searching) */}
      {searchQuery.length > 0 && renderTabs()}

      {/* Content */}
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.xs,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 40,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    height: '100%',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['5xl'],
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  trendingContainer: {
    padding: Spacing.lg,
  },
  trendingTitle: {
    ...Typography.heading,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  trendingRank: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.textSecondary,
    width: 24,
  },
  trendingInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  trendingTag: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  trendingCount: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: Spacing.md,
  },
  userAvatarPlaceholder: {
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  userName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  userSpecialty: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  userFollowers: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  roomIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  roomEmoji: {
    fontSize: 24,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  roomDescription: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  roomMembers: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  joinButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  joinButtonText: {
    ...Typography.caption,
    color: 'white',
    fontWeight: '600',
  },
  hashtagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  hashtagIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  hashtagSymbol: {
    ...Typography.heading,
    color: Colors.primary,
  },
  hashtagInfo: {
    flex: 1,
  },
  hashtagName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  hashtagCount: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
