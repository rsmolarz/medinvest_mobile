import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';

import { colors, typography, spacing, layout, shadows } from '@/theme';
import type { InvestmentFilters, InvestmentCategory, RiskLevel } from '@/types';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: InvestmentFilters;
  onApply: (filters: InvestmentFilters) => void;
}

const CATEGORIES: { value: InvestmentCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'Biotech', label: 'Biotech' },
  { value: 'Medical Devices', label: 'Medical Devices' },
  { value: 'Digital Health', label: 'Digital Health' },
  { value: 'Pharmaceuticals', label: 'Pharmaceuticals' },
  { value: 'Research', label: 'Research' },
  { value: 'Healthcare Services', label: 'Healthcare Services' },
];

const RISK_LEVELS: { value: RiskLevel | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All Risk Levels', color: colors.text.secondary },
  { value: 'Low', label: 'Low Risk', color: colors.semantic.success },
  { value: 'Medium', label: 'Medium Risk', color: colors.semantic.warning },
  { value: 'High', label: 'High Risk', color: colors.semantic.error },
];

const SORT_OPTIONS: { value: InvestmentFilters['sortBy']; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'endingSoon', label: 'Ending Soon' },
  { value: 'mostFunded', label: 'Most Funded' },
  { value: 'highestROI', label: 'Highest ROI' },
];

const MIN_INVESTMENT_OPTIONS = [
  { value: undefined, label: 'Any Amount' },
  { value: 1000, label: '$1,000+' },
  { value: 5000, label: '$5,000+' },
  { value: 10000, label: '$10,000+' },
  { value: 25000, label: '$25,000+' },
];

export default function FilterModal({
  visible,
  onClose,
  filters,
  onApply,
}: FilterModalProps) {
  const insets = useSafeAreaInsets();

  // Local state for editing
  const [localFilters, setLocalFilters] = useState<InvestmentFilters>(filters);

  // Reset local state when modal opens
  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  const handleApply = useCallback(() => {
    onApply(localFilters);
    onClose();
  }, [localFilters, onApply, onClose]);

  const handleReset = useCallback(() => {
    setLocalFilters({});
  }, []);

  const updateFilter = useCallback(
    <K extends keyof InvestmentFilters>(key: K, value: InvestmentFilters[K]) => {
      setLocalFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const activeFilterCount = Object.values(localFilters).filter(
    (v) => v !== undefined && v !== 'all'
  ).length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.backdrop}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Content */}
      <Animated.View
        entering={SlideInDown.duration(300).springify()}
        exiting={SlideOutDown.duration(200)}
        style={[
          styles.container,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={8}>
            <Feather name="x" size={24} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.title}>Filters</Text>
          <Pressable onPress={handleReset} hitSlop={8}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        </View>

        {/* Handle */}
        <View style={styles.handle} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Category Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.optionsGrid}>
              {CATEGORIES.map((category) => {
                const isSelected =
                  category.value === 'all'
                    ? !localFilters.category
                    : localFilters.category === category.value;
                return (
                  <Pressable
                    key={category.value}
                    style={[
                      styles.optionChip,
                      isSelected && styles.optionChipSelected,
                    ]}
                    onPress={() =>
                      updateFilter(
                        'category',
                        category.value === 'all' ? undefined : category.value
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        isSelected && styles.optionChipTextSelected,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Risk Level Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Risk Level</Text>
            <View style={styles.optionsRow}>
              {RISK_LEVELS.map((risk) => {
                const isSelected =
                  risk.value === 'all'
                    ? !localFilters.riskLevel
                    : localFilters.riskLevel === risk.value;
                return (
                  <Pressable
                    key={risk.value}
                    style={[
                      styles.riskChip,
                      isSelected && styles.riskChipSelected,
                      isSelected && { borderColor: risk.color },
                    ]}
                    onPress={() =>
                      updateFilter(
                        'riskLevel',
                        risk.value === 'all' ? undefined : risk.value
                      )
                    }
                  >
                    {risk.value !== 'all' && (
                      <View
                        style={[styles.riskDot, { backgroundColor: risk.color }]}
                      />
                    )}
                    <Text
                      style={[
                        styles.riskChipText,
                        isSelected && styles.riskChipTextSelected,
                      ]}
                    >
                      {risk.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Minimum Investment Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Minimum Investment</Text>
            <View style={styles.optionsRow}>
              {MIN_INVESTMENT_OPTIONS.map((option) => {
                const isSelected = localFilters.minInvestment === option.value;
                return (
                  <Pressable
                    key={option.label}
                    style={[
                      styles.optionChip,
                      isSelected && styles.optionChipSelected,
                    ]}
                    onPress={() => updateFilter('minInvestment', option.value)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        isSelected && styles.optionChipTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Sort By Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sort By</Text>
            {SORT_OPTIONS.map((option) => {
              const isSelected = localFilters.sortBy === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={styles.sortOption}
                  onPress={() => updateFilter('sortBy', option.value)}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      isSelected && styles.sortOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Feather
                      name="check"
                      size={20}
                      color={colors.primary.main}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Apply Button */}
        <View style={styles.footer}>
          <Pressable style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>
              Apply Filters
              {activeFilterCount > 0 && ` (${activeFilterCount})`}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.transparent.black50,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: layout.radiusXLarge,
    borderTopRightRadius: layout.radiusXLarge,
    maxHeight: '85%',
    ...shadows.modal,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.heading,
    color: colors.text.primary,
  },
  resetText: {
    ...typography.bodyMedium,
    color: colors.primary.main,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border.light,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: layout.radiusFull,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.surface.primary,
  },
  optionChipSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.transparent.primary10,
  },
  optionChipText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  optionChipTextSelected: {
    color: colors.primary.main,
  },
  riskChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: layout.radiusFull,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.surface.primary,
  },
  riskChipSelected: {
    backgroundColor: colors.transparent.primary10,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  riskChipText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  riskChipTextSelected: {
    color: colors.text.primary,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  sortOptionText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  sortOptionTextSelected: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  applyButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.lg,
    borderRadius: layout.radiusMedium,
    alignItems: 'center',
  },
  applyButtonText: {
    ...typography.button.medium,
    color: colors.text.inverse,
  },
});
