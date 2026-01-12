/**
 * Saved Searches
 * Quick access to frequent searches
 */

import React, { useState, useCallback, useEffect, memo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Swipeable } from 'react-native-gesture-handler';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useThemeContext } from '@/contexts/ThemeContext';
import { haptics } from '@/lib/haptics';

// Types
export interface SavedSearch {
  id: string;
  query: string;
  filters?: {
    type?: string;
    dateRange?: string;
    roomId?: string;
  };
  createdAt: string;
  lastUsedAt: string;
  useCount: number;
  notificationsEnabled: boolean;
}

export interface RecentSearch {
  query: string;
  timestamp: string;
}

const SAVED_SEARCHES_KEY = 'saved_searches';
const RECENT_SEARCHES_KEY = 'recent_searches';
const MAX_RECENT_SEARCHES = 20;

// =============================================================================
// SAVED SEARCHES SERVICE
// =============================================================================

class SavedSearchesService {
  private savedSearches: SavedSearch[] = [];
  private recentSearches: RecentSearch[] = [];
  private loaded: boolean = false;

  async load(): Promise<void> {
    if (this.loaded) return;

    try {
      const [savedData, recentData] = await Promise.all([
        AsyncStorage.getItem(SAVED_SEARCHES_KEY),
        AsyncStorage.getItem(RECENT_SEARCHES_KEY),
      ]);

      if (savedData) {
        this.savedSearches = JSON.parse(savedData);
      }
      if (recentData) {
        this.recentSearches = JSON.parse(recentData);
      }
      this.loaded = true;
    } catch (error) {
      console.error('[SavedSearches] Error loading:', error);
    }
  }

  private async persistSaved(): Promise<void> {
    try {
      await AsyncStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(this.savedSearches));
    } catch (error) {
      console.error('[SavedSearches] Error saving:', error);
    }
  }

  private async persistRecent(): Promise<void> {
    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(this.recentSearches));
    } catch (error) {
      console.error('[SavedSearches] Error saving recent:', error);
    }
  }

  // Saved searches
  async getSavedSearches(): Promise<SavedSearch[]> {
    await this.load();
    return [...this.savedSearches].sort((a, b) => 
      new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
    );
  }

  async saveSearch(query: string, filters?: SavedSearch['filters']): Promise<SavedSearch> {
    await this.load();

    // Check if already exists
    const existing = this.savedSearches.find(s => 
      s.query.toLowerCase() === query.toLowerCase()
    );

    if (existing) {
      existing.lastUsedAt = new Date().toISOString();
      existing.useCount++;
      await this.persistSaved();
      return existing;
    }

    const newSearch: SavedSearch = {
      id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      query,
      filters,
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      useCount: 1,
      notificationsEnabled: false,
    };

    this.savedSearches.unshift(newSearch);
    await this.persistSaved();
    return newSearch;
  }

  async deleteSavedSearch(id: string): Promise<void> {
    await this.load();
    this.savedSearches = this.savedSearches.filter(s => s.id !== id);
    await this.persistSaved();
  }

  async toggleNotifications(id: string): Promise<boolean> {
    await this.load();
    const search = this.savedSearches.find(s => s.id === id);
    if (search) {
      search.notificationsEnabled = !search.notificationsEnabled;
      await this.persistSaved();
      return search.notificationsEnabled;
    }
    return false;
  }

  async updateLastUsed(id: string): Promise<void> {
    await this.load();
    const search = this.savedSearches.find(s => s.id === id);
    if (search) {
      search.lastUsedAt = new Date().toISOString();
      search.useCount++;
      await this.persistSaved();
    }
  }

  async isSearchSaved(query: string): Promise<boolean> {
    await this.load();
    return this.savedSearches.some(s => 
      s.query.toLowerCase() === query.toLowerCase()
    );
  }

  // Recent searches
  async getRecentSearches(): Promise<RecentSearch[]> {
    await this.load();
    return this.recentSearches;
  }

  async addRecentSearch(query: string): Promise<void> {
    await this.load();

    // Remove if exists
    this.recentSearches = this.recentSearches.filter(
      s => s.query.toLowerCase() !== query.toLowerCase()
    );

    // Add to front
    this.recentSearches.unshift({
      query,
      timestamp: new Date().toISOString(),
    });

    // Trim to max
    if (this.recentSearches.length > MAX_RECENT_SEARCHES) {
      this.recentSearches = this.recentSearches.slice(0, MAX_RECENT_SEARCHES);
    }

    await this.persistRecent();
  }

  async removeRecentSearch(query: string): Promise<void> {
    await this.load();
    this.recentSearches = this.recentSearches.filter(
      s => s.query.toLowerCase() !== query.toLowerCase()
    );
    await this.persistRecent();
  }

  async clearRecentSearches(): Promise<void> {
    this.recentSearches = [];
    await this.persistRecent();
  }
}

export const savedSearchesService = new SavedSearchesService();

// =============================================================================
// SAVED SEARCHES SCREEN
// =============================================================================

export default function SavedSearchesScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useThemeContext();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'saved' | 'recent'>('saved');

  useEffect(() => {
    loadSearches();
  }, []);

  const loadSearches = async () => {
    setIsLoading(true);
    const [saved, recent] = await Promise.all([
      savedSearchesService.getSavedSearches(),
      savedSearchesService.getRecentSearches(),
    ]);
    setSavedSearches(saved);
    setRecentSearches(recent);
    setIsLoading(false);
  };

  const handleSearchPress = useCallback((query: string, searchId?: string) => {
    haptics.selection();
    if (searchId) {
      savedSearchesService.updateLastUsed(searchId);
    }
    navigation.navigate('Search', { initialQuery: query });
  }, [navigation]);

  const handleDeleteSaved = useCallback((id: string) => {
    Alert.alert(
      'Delete Saved Search',
      'Are you sure you want to delete this saved search?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            haptics.delete();
            await savedSearchesService.deleteSavedSearch(id);
            setSavedSearches(prev => prev.filter(s => s.id !== id));
          },
        },
      ]
    );
  }, []);

  const handleToggleNotifications = useCallback(async (id: string) => {
    haptics.toggle();
    const enabled = await savedSearchesService.toggleNotifications(id);
    setSavedSearches(prev => 
      prev.map(s => s.id === id ? { ...s, notificationsEnabled: enabled } : s)
    );
  }, []);

  const handleRemoveRecent = useCallback(async (query: string) => {
    haptics.buttonPress();
    await savedSearchesService.removeRecentSearch(query);
    setRecentSearches(prev => prev.filter(s => s.query !== query));
  }, []);

  const handleClearRecent = useCallback(() => {
    Alert.alert(
      'Clear Recent Searches',
      'Are you sure you want to clear all recent searches?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            haptics.delete();
            await savedSearchesService.clearRecentSearches();
            setRecentSearches([]);
          },
        },
      ]
    );
  }, []);

  const renderSavedSearch = ({ item }: { item: SavedSearch }) => (
    <Swipeable
      renderRightActions={() => (
        <TouchableOpacity
          style={[styles.deleteAction, { backgroundColor: colors.error }]}
          onPress={() => handleDeleteSaved(item.id)}
        >
          <Ionicons name="trash-outline" size={22} color="white" />
        </TouchableOpacity>
      )}
      overshootRight={false}
    >
      <TouchableOpacity
        style={[styles.searchItem, { backgroundColor: colors.surface }]}
        onPress={() => handleSearchPress(item.query, item.id)}
      >
        <View style={[styles.searchIcon, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="search" size={18} color={colors.primary} />
        </View>
        <View style={styles.searchContent}>
          <ThemedText style={[styles.searchQuery, { color: colors.textPrimary }]}>
            {item.query}
          </ThemedText>
          <ThemedText style={[styles.searchMeta, { color: colors.textSecondary }]}>
            Used {item.useCount} time{item.useCount !== 1 ? 's' : ''}
          </ThemedText>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => handleToggleNotifications(item.id)}
        >
          <Ionicons
            name={item.notificationsEnabled ? 'notifications' : 'notifications-outline'}
            size={20}
            color={item.notificationsEnabled ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Swipeable>
  );

  const renderRecentSearch = ({ item }: { item: RecentSearch }) => (
    <TouchableOpacity
      style={[styles.searchItem, { backgroundColor: colors.surface }]}
      onPress={() => handleSearchPress(item.query)}
    >
      <View style={[styles.searchIcon, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
      </View>
      <View style={styles.searchContent}>
        <ThemedText style={[styles.searchQuery, { color: colors.textPrimary }]}>
          {item.query}
        </ThemedText>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveRecent(item.query)}
      >
        <Ionicons name="close" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = (type: 'saved' | 'recent') => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={type === 'saved' ? 'bookmark-outline' : 'time-outline'}
        size={64}
        color={colors.textSecondary}
      />
      <ThemedText style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        {type === 'saved' ? 'No saved searches' : 'No recent searches'}
      </ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {type === 'saved'
          ? 'Save searches to quickly access them later'
          : 'Your recent searches will appear here'}
      </ThemedText>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Searches
        </ThemedText>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'saved' && { backgroundColor: colors.surface },
          ]}
          onPress={() => {
            haptics.selection();
            setActiveTab('saved');
          }}
        >
          <ThemedText
            style={[
              styles.tabText,
              { color: activeTab === 'saved' ? colors.primary : colors.textSecondary },
            ]}
          >
            Saved
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'recent' && { backgroundColor: colors.surface },
          ]}
          onPress={() => {
            haptics.selection();
            setActiveTab('recent');
          }}
        >
          <ThemedText
            style={[
              styles.tabText,
              { color: activeTab === 'recent' ? colors.primary : colors.textSecondary },
            ]}
          >
            Recent
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Clear button for recent */}
      {activeTab === 'recent' && recentSearches.length > 0 && (
        <TouchableOpacity
          style={[styles.clearButton, { borderBottomColor: colors.border }]}
          onPress={handleClearRecent}
        >
          <ThemedText style={[styles.clearButtonText, { color: colors.error }]}>
            Clear All
          </ThemedText>
        </TouchableOpacity>
      )}

      {/* Lists */}
      {activeTab === 'saved' ? (
        <FlatList
          data={savedSearches}
          renderItem={renderSavedSearch}
          keyExtractor={(item) => item.id}
          contentContainerStyle={savedSearches.length === 0 ? styles.emptyList : styles.listContent}
          ListEmptyComponent={() => renderEmptyState('saved')}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      ) : (
        <FlatList
          data={recentSearches}
          renderItem={renderRecentSearch}
          keyExtractor={(item) => item.query}
          contentContainerStyle={recentSearches.length === 0 ? styles.emptyList : styles.listContent}
          ListEmptyComponent={() => renderEmptyState('recent')}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      )}
    </SafeAreaView>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  useEffect(() => {
    loadSearches();
  }, []);

  const loadSearches = async () => {
    const [saved, recent] = await Promise.all([
      savedSearchesService.getSavedSearches(),
      savedSearchesService.getRecentSearches(),
    ]);
    setSavedSearches(saved);
    setRecentSearches(recent);
  };

  const saveSearch = useCallback(async (query: string, filters?: SavedSearch['filters']) => {
    const search = await savedSearchesService.saveSearch(query, filters);
    setSavedSearches(prev => [search, ...prev.filter(s => s.id !== search.id)]);
    return search;
  }, []);

  const addRecentSearch = useCallback(async (query: string) => {
    await savedSearchesService.addRecentSearch(query);
    setRecentSearches(await savedSearchesService.getRecentSearches());
  }, []);

  const isSearchSaved = useCallback(async (query: string) => {
    return savedSearchesService.isSearchSaved(query);
  }, []);

  return {
    savedSearches,
    recentSearches,
    saveSearch,
    addRecentSearch,
    isSearchSaved,
    refresh: loadSearches,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.heading,
  },
  headerRight: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    margin: Spacing.lg,
    padding: 4,
    borderRadius: BorderRadius.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  tabText: {
    ...Typography.body,
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    alignItems: 'flex-end',
  },
  clearButtonText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  listContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  emptyList: {
    flexGrow: 1,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  searchIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  searchQuery: {
    ...Typography.body,
    fontWeight: '500',
  },
  searchMeta: {
    ...Typography.small,
    marginTop: 2,
  },
  notificationButton: {
    padding: Spacing.sm,
  },
  removeButton: {
    padding: Spacing.sm,
  },
  deleteAction: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    marginLeft: Spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.heading,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
});
