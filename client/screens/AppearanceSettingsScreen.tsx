/**
 * Appearance Settings Screen
 * Dark mode toggle and theme customization
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { useThemeContext, ThemeMode } from '@/contexts/ThemeContext';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';

interface ThemeOption {
  mode: ThemeMode;
  title: string;
  description: string;
  icon: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    mode: 'light',
    title: 'Light',
    description: 'Always use light theme',
    icon: 'sunny-outline',
  },
  {
    mode: 'dark',
    title: 'Dark',
    description: 'Always use dark theme',
    icon: 'moon-outline',
  },
  {
    mode: 'system',
    title: 'System',
    description: 'Match device settings',
    icon: 'phone-portrait-outline',
  },
];

export default function AppearanceSettingsScreen() {
  const navigation = useNavigation<any>();
  const { mode, setMode, colors, isDark } = useThemeContext();

  const handleSelectTheme = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Appearance
        </ThemedText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            THEME
          </ThemedText>
          
          <View style={[styles.optionsCard, { backgroundColor: colors.surface }]}>
            {THEME_OPTIONS.map((option, index) => (
              <TouchableOpacity
                key={option.mode}
                style={[
                  styles.optionItem,
                  index < THEME_OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
                onPress={() => handleSelectTheme(option.mode)}
              >
                <View style={[styles.optionIcon, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons 
                    name={option.icon as any} 
                    size={22} 
                    color={mode === option.mode ? colors.primary : colors.textSecondary} 
                  />
                </View>
                <View style={styles.optionContent}>
                  <ThemedText style={[styles.optionTitle, { color: colors.textPrimary }]}>
                    {option.title}
                  </ThemedText>
                  <ThemedText style={[styles.optionDescription, { color: colors.textSecondary }]}>
                    {option.description}
                  </ThemedText>
                </View>
                {mode === option.mode ? (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            PREVIEW
          </ThemedText>
          
          <View style={[styles.previewCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.previewHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.previewNav}>
                <View style={[styles.previewDot, { backgroundColor: colors.error }]} />
                <View style={[styles.previewDot, { backgroundColor: colors.warning }]} />
                <View style={[styles.previewDot, { backgroundColor: colors.success }]} />
              </View>
              <View style={[styles.previewLine, { backgroundColor: colors.backgroundSecondary, width: 120 }]} />
            </View>
            <View style={styles.previewContent}>
              <View style={styles.previewPost}>
                <View style={[styles.previewAvatar, { backgroundColor: colors.primary }]} />
                <View style={styles.previewPostContent}>
                  <View style={[styles.previewLine, { backgroundColor: colors.textPrimary, width: 100, height: 12, opacity: 0.8 }]} />
                  <View style={[styles.previewLine, { backgroundColor: colors.textSecondary, width: 150, height: 10, marginTop: Spacing.xs }]} />
                </View>
              </View>
              <View style={styles.previewActions}>
                <View style={[styles.previewButton, { backgroundColor: colors.backgroundSecondary }]} />
                <View style={[styles.previewButton, { backgroundColor: colors.primary }]} />
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.info + '15' }]}>
          <Ionicons name="information-circle" size={20} color={colors.info} />
          <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
            System mode will automatically switch between light and dark themes based on your device settings.
          </ThemedText>
        </View>
      </ScrollView>
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.heading,
    fontSize: 17,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.caption,
    fontWeight: '600',
    marginBottom: Spacing.md,
    marginLeft: Spacing.sm,
  },
  optionsCard: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...Typography.body,
    fontWeight: '500',
  },
  optionDescription: {
    ...Typography.small,
    marginTop: 2,
  },
  previewCard: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  previewNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  previewDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  previewLine: {
    height: 12,
    borderRadius: 6,
  },
  previewContent: {
    padding: Spacing.md,
  },
  previewPost: {
    flexDirection: 'row',
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.md,
  },
  previewPostContent: {
    flex: 1,
  },
  previewActions: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  previewButton: {
    width: 60,
    height: 28,
    borderRadius: 14,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  infoText: {
    ...Typography.small,
    flex: 1,
    lineHeight: 20,
  },
});
