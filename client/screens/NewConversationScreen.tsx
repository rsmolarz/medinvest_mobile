/**
 * NewConversation Screen
 * Start a new direct message conversation
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { usersApi, searchApi } from '@/lib/api';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { debounce } from '@/lib/utils';

export default function NewConversationScreen() {
  const navigation = useNavigation<any>();
  const appColors = useAppColors();
  const { user: currentUser } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const handleSearch = useCallback(
    debounce((query: string) => {
      setDebouncedQuery(query);
    }, 300),
    []
  );

  const handleQueryChange = (text: string) => {
    setSearchQuery(text);
    handleSearch(text);
  };

  const { data: suggestedData, isLoading: suggestedLoading, error: suggestedError } = useQuery({
    queryKey: ['exploreUsers'],
    queryFn: async () => {
      console.log('Fetching explore users...');
      const response = await usersApi.explore();
      console.log('Explore response:', response);
      return response.data?.users || [];
    },
    enabled: !debouncedQuery,
  });

  console.log('suggestedData:', suggestedData, 'error:', suggestedError, 'loading:', suggestedLoading);

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['searchUsers', debouncedQuery],
    queryFn: async () => {
      const response = await usersApi.search(debouncedQuery);
      return response.data?.users || [];
    },
    enabled: debouncedQuery.length > 0,
  });

  const users = debouncedQuery ? searchResults : suggestedData;
  const isLoading = debouncedQuery ? searchLoading : suggestedLoading;

  const handleUserPress = useCallback((userId: string | number) => {
    navigation.replace('Conversation', { userId: String(userId) });
  }, [navigation]);

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[styles.userItem, { backgroundColor: appColors.surface, borderBottomColor: appColors.border }]}
      onPress={() => handleUserPress(item.id)}
    >
      {item.avatarUrl ? (
        <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <ThemedText style={styles.avatarText}>
            {item.firstName?.[0]}{item.lastName?.[0]}
          </ThemedText>
        </View>
      )}
      <View style={styles.userInfo}>
        <View style={styles.userNameRow}>
          <ThemedText style={[styles.userName, { color: appColors.textPrimary }]}>{item.fullName}</ThemedText>
          {item.isVerified && (
            <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
          )}
        </View>
        {item.specialty && (
          <ThemedText style={[styles.userSpecialty, { color: appColors.textSecondary }]}>{item.specialty}</ThemedText>
        )}
      </View>
      <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
    </TouchableOpacity>
  );

  const renderSectionHeader = () => {
    if (debouncedQuery) return null;
    return (
      <View style={styles.sectionHeader}>
        <ThemedText style={[styles.sectionTitle, { color: appColors.textSecondary }]}>
          {suggestedData && suggestedData.length > 0 ? 'People to Message' : 'Suggested'}
        </ThemedText>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={48} color={appColors.textSecondary} />
        <ThemedText style={[styles.emptyTitle, { color: appColors.textPrimary }]}>
          {debouncedQuery ? 'No users found' : 'No suggestions'}
        </ThemedText>
        <ThemedText style={[styles.emptySubtitle, { color: appColors.textSecondary }]}>
          {debouncedQuery
            ? 'Try searching for a different name'
            : 'Follow people to see them here'}
        </ThemedText>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: appColors.surface, borderBottomColor: appColors.border }]}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <ThemedText style={styles.cancelText}>Cancel</ThemedText>
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: appColors.textPrimary }]}>New Message</ThemedText>
        <View style={styles.cancelButton} />
      </View>

      {/* Search Input */}
      <View style={[styles.searchContainer, { backgroundColor: appColors.surface, borderBottomColor: appColors.border }]}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color={appColors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: appColors.textPrimary }]}
            placeholder="Search people..."
            placeholderTextColor={appColors.textSecondary}
            value={searchQuery}
            onChangeText={handleQueryChange}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleQueryChange('')}>
              <Ionicons name="close-circle" size={20} color={appColors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderSectionHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={users?.length === 0 ? styles.emptyList : undefined}
        showsVerticalScrollIndicator={false}
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  cancelButton: {
    width: 60,
  },
  cancelText: {
    ...Typography.body,
    color: Colors.primary,
  },
  headerTitle: {
    ...Typography.heading,
  },
  searchContainer: {
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  searchInputWrapper: {
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
  sectionHeader: {
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  avatar: {
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['5xl'],
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['5xl'],
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.heading,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
