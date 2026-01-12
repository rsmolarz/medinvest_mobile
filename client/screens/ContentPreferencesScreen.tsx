/**
 * Content Preferences Screen
 * Filter and customize content settings
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useThemeContext } from '@/contexts/ThemeContext';
import { haptics } from '@/lib/haptics';

// Content preferences
interface ContentPreferences {
  // Content filtering
  hideNSFW: boolean;
  blurSensitiveImages: boolean;
  hideSpoilers: boolean;
  
  // Feed preferences
  showTrendingPosts: boolean;
  showSuggestedUsers: boolean;
  showPromotedContent: boolean;
  
  // Post display
  autoplayVideos: 'always' | 'wifi' | 'never';
  reduceAnimations: boolean;
  compactMode: boolean;
  
  // Language & Region
  contentLanguages: string[];
  translatePosts: boolean;
  
  // Keywords
  mutedKeywords: string[];
  
  // Interaction preferences
  showPostMetrics: boolean; // likes, comments count
  showUserBadges: boolean;
  confirmBeforePosting: boolean;
}

const DEFAULT_PREFERENCES: ContentPreferences = {
  hideNSFW: true,
  blurSensitiveImages: true,
  hideSpoilers: false,
  showTrendingPosts: true,
  showSuggestedUsers: true,
  showPromotedContent: true,
  autoplayVideos: 'wifi',
  reduceAnimations: false,
  compactMode: false,
  contentLanguages: ['en'],
  translatePosts: false,
  mutedKeywords: [],
  showPostMetrics: true,
  showUserBadges: true,
  confirmBeforePosting: false,
};

const STORAGE_KEY = 'content_preferences';

export default function ContentPreferencesScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useThemeContext();
  const [preferences, setPreferences] = useState<ContentPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Error loading content preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async (newPrefs: ContentPreferences) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
    } catch (error) {
      console.error('Error saving content preferences:', error);
    }
  };

  const updatePreference = useCallback(<K extends keyof ContentPreferences>(
    key: K,
    value: ContentPreferences[K]
  ) => {
    haptics.toggle();
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  }, [preferences]);

  const addMutedKeyword = useCallback(() => {
    const keyword = newKeyword.trim().toLowerCase();
    if (!keyword) return;
    if (preferences.mutedKeywords.includes(keyword)) {
      Alert.alert('Already Added', 'This keyword is already in your muted list.');
      return;
    }

    haptics.success();
    const newKeywords = [...preferences.mutedKeywords, keyword];
    updatePreference('mutedKeywords', newKeywords);
    setNewKeyword('');
  }, [newKeyword, preferences.mutedKeywords, updatePreference]);

  const removeMutedKeyword = useCallback((keyword: string) => {
    haptics.buttonPress();
    const newKeywords = preferences.mutedKeywords.filter(k => k !== keyword);
    updatePreference('mutedKeywords', newKeywords);
  }, [preferences.mutedKeywords, updatePreference]);

  const renderSwitch = (
    key: keyof ContentPreferences,
    label: string,
    description?: string
  ) => (
    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
      <View style={styles.settingInfo}>
        <ThemedText style={[styles.settingLabel, { color: colors.textPrimary }]}>
          {label}
        </ThemedText>
        {description && (
          <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
            {description}
          </ThemedText>
        )}
      </View>
      <Switch
        value={preferences[key] as boolean}
        onValueChange={(value) => updatePreference(key, value)}
        trackColor={{ false: colors.border, true: colors.primary + '80' }}
        thumbColor={preferences[key] ? colors.primary : colors.textSecondary}
      />
    </View>
  );

  const renderSelectOption = (
    key: keyof ContentPreferences,
    label: string,
    options: { value: string; label: string }[],
    description?: string
  ) => (
    <View style={styles.settingSection}>
      <View style={styles.settingHeader}>
        <ThemedText style={[styles.settingLabel, { color: colors.textPrimary }]}>
          {label}
        </ThemedText>
        {description && (
          <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
            {description}
          </ThemedText>
        )}
      </View>
      <View style={styles.optionsRow}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              {
                backgroundColor: preferences[key] === option.value
                  ? colors.primary
                  : colors.backgroundSecondary,
                borderColor: preferences[key] === option.value
                  ? colors.primary
                  : colors.border,
              },
            ]}
            onPress={() => updatePreference(key, option.value as any)}
          >
            <ThemedText
              style={[
                styles.optionText,
                { color: preferences[key] === option.value ? 'white' : colors.textPrimary },
              ]}
            >
              {option.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
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
          Content Preferences
        </ThemedText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Content Filtering */}
        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            CONTENT FILTERING
          </ThemedText>
        </View>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {renderSwitch('hideNSFW', 'Hide sensitive content', 'Hide posts marked as sensitive')}
          {renderSwitch('blurSensitiveImages', 'Blur sensitive images', 'Blur images until you tap to reveal')}
          {renderSwitch('hideSpoilers', 'Hide spoilers', 'Collapse spoiler-tagged content')}
        </View>

        {/* Feed Preferences */}
        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            FEED PREFERENCES
          </ThemedText>
        </View>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {renderSwitch('showTrendingPosts', 'Show trending posts', 'Include trending content in your feed')}
          {renderSwitch('showSuggestedUsers', 'Show suggested users', 'See people you may want to follow')}
          {renderSwitch('showPromotedContent', 'Show promoted content', 'See sponsored posts and deals')}
        </View>

        {/* Media Settings */}
        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            MEDIA
          </ThemedText>
        </View>
        <View style={[styles.section, { backgroundColor: colors.surface, paddingVertical: Spacing.md }]}>
          {renderSelectOption(
            'autoplayVideos',
            'Autoplay videos',
            [
              { value: 'always', label: 'Always' },
              { value: 'wifi', label: 'Wi-Fi only' },
              { value: 'never', label: 'Never' },
            ],
            'Automatically play videos in feed'
          )}
        </View>

        {/* Display */}
        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            DISPLAY
          </ThemedText>
        </View>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {renderSwitch('compactMode', 'Compact mode', 'Show more posts with smaller cards')}
          {renderSwitch('reduceAnimations', 'Reduce animations', 'Minimize motion effects')}
          {renderSwitch('showPostMetrics', 'Show post metrics', 'Display likes and comment counts')}
          {renderSwitch('showUserBadges', 'Show user badges', 'Display verification and achievement badges')}
        </View>

        {/* Posting */}
        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            POSTING
          </ThemedText>
        </View>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {renderSwitch('confirmBeforePosting', 'Confirm before posting', 'Show confirmation dialog before publishing')}
          {renderSwitch('translatePosts', 'Auto-translate posts', 'Translate posts in other languages')}
        </View>

        {/* Muted Keywords */}
        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            MUTED KEYWORDS
          </ThemedText>
          <ThemedText style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Posts containing these words will be hidden from your feed
          </ThemedText>
        </View>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {/* Add keyword input */}
          <TouchableOpacity
            style={[styles.addKeywordButton, { borderBottomColor: colors.border }]}
            onPress={() => {
              Alert.prompt(
                'Add Muted Keyword',
                'Enter a word or phrase to mute',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Add',
                    onPress: (text) => {
                      if (text?.trim()) {
                        const keyword = text.trim().toLowerCase();
                        if (!preferences.mutedKeywords.includes(keyword)) {
                          haptics.success();
                          updatePreference('mutedKeywords', [...preferences.mutedKeywords, keyword]);
                        }
                      }
                    },
                  },
                ],
                'plain-text'
              );
            }}
          >
            <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
            <ThemedText style={[styles.addKeywordText, { color: colors.primary }]}>
              Add keyword
            </ThemedText>
          </TouchableOpacity>

          {/* Keyword list */}
          {preferences.mutedKeywords.length === 0 ? (
            <View style={styles.emptyKeywords}>
              <ThemedText style={[styles.emptyKeywordsText, { color: colors.textSecondary }]}>
                No muted keywords
              </ThemedText>
            </View>
          ) : (
            <View style={styles.keywordsList}>
              {preferences.mutedKeywords.map((keyword) => (
                <View
                  key={keyword}
                  style={[styles.keywordChip, { backgroundColor: colors.backgroundSecondary }]}
                >
                  <ThemedText style={[styles.keywordText, { color: colors.textPrimary }]}>
                    {keyword}
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.removeKeyword}
                    onPress={() => removeMutedKeyword(keyword)}
                  >
                    <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Reset */}
        <TouchableOpacity
          style={[styles.resetButton, { borderColor: colors.error }]}
          onPress={() => {
            Alert.alert(
              'Reset Preferences',
              'Are you sure you want to reset all content preferences to default?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: () => {
                    haptics.warning();
                    setPreferences(DEFAULT_PREFERENCES);
                    savePreferences(DEFAULT_PREFERENCES);
                  },
                },
              ]
            );
          }}
        >
          <ThemedText style={[styles.resetButtonText, { color: colors.error }]}>
            Reset to Defaults
          </ThemedText>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Export preferences service for use in other components
export const contentPreferencesService = {
  async get(): Promise<ContentPreferences> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading content preferences:', error);
    }
    return DEFAULT_PREFERENCES;
  },

  async shouldHidePost(content: string, keywords: string[]): Promise<boolean> {
    const prefs = await this.get();
    const mutedKeywords = prefs.mutedKeywords;
    if (mutedKeywords.length === 0) return false;

    const lowerContent = content.toLowerCase();
    return mutedKeywords.some(keyword => lowerContent.includes(keyword));
  },
};

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
  content: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.small,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    ...Typography.small,
    marginTop: 4,
  },
  section: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.card,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    ...Typography.body,
  },
  settingDescription: {
    ...Typography.small,
    marginTop: 2,
  },
  settingSection: {
    padding: Spacing.lg,
  },
  settingHeader: {
    marginBottom: Spacing.md,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  optionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  addKeywordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  addKeywordText: {
    ...Typography.body,
    fontWeight: '500',
  },
  emptyKeywords: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyKeywordsText: {
    ...Typography.caption,
  },
  keywordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  keywordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  keywordText: {
    ...Typography.caption,
  },
  removeKeyword: {
    padding: 2,
  },
  resetButton: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  resetButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
});
