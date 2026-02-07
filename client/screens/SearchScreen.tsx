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
import { useAppColors } from '@/hooks/useAppColors';
import { searchApi, feedApi } from '@/lib/api';
import { SearchType, Post, User, Room, TrendingTopic } from '@/types';
import { formatNumber, debounce } from '@/lib/utils';
import PostCard from '@/components/PostCard';

type TabType = 'top' | 'posts' | 'users' | 'rooms' | 'tags';

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const inputRef = useRef<TextInput>(null);
  const appColors = useAppColors();
  
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
    <View style={[styles.tabsContainer, { backgroundColor: appColors.surface, borderBottomColor: appColors.border }]}>
      {(['top', 'posts', 'users', 'rooms', 'tags'] as TabType[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.tabActive]}
          onPress={() => setActiveTab(tab)}
        >
          <ThemedText style={[styles.tabText, { color: appColors.textSecondary }, activeTab === tab && styles.tabTextActive]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity style={[styles.userItem, { backgroundColor: appColors.surface, borderBottomColor: appColors.border }]} onPress={() => handleUserPress(item.id)}>
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
          <ThemedText style={[styles.userName, { color: appColors.textPrimary }]}>{item.full_name}</ThemedText>
          {item.is_verified && (
            <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
          )}
        </View>
        {item.specialty && (
          <ThemedText style={[styles.userSpecialty, { color: appColors.textSecondary }]}>{item.specialty}</ThemedText>
        )}
        <ThemedText style={[styles.userFollowers, { color: appColors.textSecondary }]}>
          {formatNumber(item.followers_count)} followers
        </ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={20} color={appColors.textSecondary} />
    </TouchableOpacity>
  );

  const renderRoomItem = ({ item }: { item: Room }) => (
    <TouchableOpacity style={[styles.roomItem, { backgroundColor: appColors.surface, borderBottomColor: appColors.border }]} onPress={() => handleRoomPress(item.slug)}>
      <View style={[styles.roomIcon, { backgroundColor: item.color + '20' }]}>
        <ThemedText style={styles.roomEmoji}>{item.icon}</ThemedText>
      </View>
      <View style={styles.roomInfo}>
        <ThemedText style={[styles.roomName, { color: appColors.textPrimary }]}>{item.name}</ThemedText>
        <ThemedText style={[styles.roomDescription, { color: appColors.textSecondary }]} numberOfLines={1}>
          {item.description}
        </ThemedText>
        <ThemedText style={[styles.roomMembers, { color: appColors.textSecondary }]}>
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
    <TouchableOpacity style={[styles.hashtagItem, { backgroundColor: appColors.surface, borderBottomColor: appColors.border }]} onPress={() => handleHashtagPress(item.hashtag)}>
      <View style={styles.hashtagIcon}>
        <ThemedText style={styles.hashtagSymbol}>#</ThemedText>
      </View>
      <View style={styles.hashtagInfo}>
        <ThemedText style={[styles.hashtagName, { color: appColors.textPrimary }]}>{item.hashtag}</ThemedText>
        <ThemedText style={[styles.hashtagCount, { color: appColors.textSecondary }]}>
          {formatNumber(item.count)} posts
        </ThemedText>
      </View>
      <Ionicons 
        name={item.trend === 'up' ? 'trending-up' : item.trend === 'down' ? 'trending-down' : 'remove'} 
        size={20} 
        color={item.trend === 'up' ? Colors.secondary : item.trend === 'down' ? appColors.error : appColors.textSecondary} 
      />
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (!searchQuery) {
      // Show trending topics
      return (
        <View style={styles.trendingContainer}>
          <ThemedText style={[styles.trendingTitle, { color: appColors.textPrimary }]}>Trending Topics</ThemedText>
          {trendingData?.map((topic, index) => (
            <TouchableOpacity
              key={topic.hashtag}
              style={[styles.trendingItem, { borderBottomColor: appColors.border }]}
              onPress={() => handleHashtagPress(topic.hashtag)}
            >
              <ThemedText style={[styles.trendingRank, { color: appColors.textSecondary }]}>{index + 1}</ThemedText>
              <View style={styles.trendingInfo}>
                <ThemedText style={[styles.trendingTag, { color: appColors.textPrimary }]}>#{topic.hashtag}</ThemedText>
                <ThemedText style={[styles.trendingCount, { color: appColors.textSecondary }]}>
                  {formatNumber(topic.count)} posts
                </ThemedText>
              </View>
              <Ionicons 
                name={topic.trend === 'up' ? 'trending-up' : 'trending-down'} 
                size={18} 
                color={topic.trend === 'up' ? Colors.secondary : appColors.error} 
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
                <ThemedText style={[styles.emptyText, { color: appColors.textSecondary }]}>No users found</ThemedText>
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
                <ThemedText style={[styles.emptyText, { color: appColors.textSecondary }]}>No rooms found</ThemedText>
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
                <ThemedText style={[styles.emptyText, { color: appColors.textSecondary }]}>No hashtags found</ThemedText>
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
                <ThemedText style={[styles.emptyText, { color: appColors.textSecondary }]}>No posts found</ThemedText>
              </View>
            }
          />
        );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['top']}>
      {/* Search Header */}
      <View style={[styles.header, { backgroundColor: appColors.surface, borderBottomColor: appColors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={appColors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={appColors.textSecondary} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: appColors.textPrimary }]}
            placeholder="Search MedInvest..."
            placeholderTextColor={appColors.textSecondary}
            value={query}
            onChangeText={handleQueryChange}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
              <Ionicons name="close-circle" size={20} color={appColors.textSecondary} />
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
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
    height: '100%',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
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
  },
  trendingContainer: {
    padding: Spacing.lg,
  },
  trendingTitle: {
    ...Typography.heading,
    marginBottom: Spacing.lg,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  trendingRank: {
    ...Typography.body,
    fontWeight: '700',
    width: 24,
  },
  trendingInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  trendingTag: {
    ...Typography.body,
    fontWeight: '600',
  },
  trendingCount: {
    ...Typography.small,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
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
  },
  userSpecialty: {
    ...Typography.small,
    marginTop: 2,
  },
  userFollowers: {
    ...Typography.small,
    marginTop: 2,
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
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
  },
  roomDescription: {
    ...Typography.small,
    marginTop: 2,
  },
  roomMembers: {
    ...Typography.small,
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
    borderBottomWidth: 1,
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
  },
  hashtagCount: {
    ...Typography.small,
    marginTop: 2,
  },
});
