/**
 * Search Filters Component
 * Filter search results by date, type, room, etc.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useThemeContext } from '@/contexts/ThemeContext';
import { haptics } from '@/lib/haptics';

// Filter types
export type SearchType = 'all' | 'posts' | 'users' | 'rooms' | 'deals' | 'news';
export type DateRange = 'any' | 'today' | 'week' | 'month' | 'year' | 'custom';
export type SortBy = 'relevance' | 'recent' | 'popular';

export interface SearchFilters {
  type: SearchType;
  dateRange: DateRange;
  customDateStart?: Date;
  customDateEnd?: Date;
  sortBy: SortBy;
  roomId?: string;
  verified?: boolean;
}

const DEFAULT_FILTERS: SearchFilters = {
  type: 'all',
  dateRange: 'any',
  sortBy: 'relevance',
};

// Type options
const TYPE_OPTIONS: { value: SearchType; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: 'apps-outline' },
  { value: 'posts', label: 'Posts', icon: 'document-text-outline' },
  { value: 'users', label: 'People', icon: 'people-outline' },
  { value: 'rooms', label: 'Rooms', icon: 'grid-outline' },
  { value: 'deals', label: 'Deals', icon: 'briefcase-outline' },
  { value: 'news', label: 'News', icon: 'newspaper-outline' },
];

// Date range options
const DATE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 'any', label: 'Any time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Past week' },
  { value: 'month', label: 'Past month' },
  { value: 'year', label: 'Past year' },
  { value: 'custom', label: 'Custom range' },
];

// Sort options
const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'relevance', label: 'Most relevant' },
  { value: 'recent', label: 'Most recent' },
  { value: 'popular', label: 'Most popular' },
];

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  rooms?: { id: string; name: string }[];
}

export default function SearchFiltersComponent({
  filters,
  onFiltersChange,
  rooms = [],
}: SearchFiltersProps) {
  const { colors } = useThemeContext();
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [tempFilters, setTempFilters] = useState<SearchFilters>(filters);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.type !== 'all') count++;
    if (filters.dateRange !== 'any') count++;
    if (filters.sortBy !== 'relevance') count++;
    if (filters.roomId) count++;
    if (filters.verified) count++;
    return count;
  }, [filters]);

  const handleOpenFilters = useCallback(() => {
    setTempFilters(filters);
    setShowFiltersModal(true);
    haptics.modalOpen();
  }, [filters]);

  const handleApplyFilters = useCallback(() => {
    onFiltersChange(tempFilters);
    setShowFiltersModal(false);
    haptics.success();
  }, [tempFilters, onFiltersChange]);

  const handleResetFilters = useCallback(() => {
    setTempFilters(DEFAULT_FILTERS);
    haptics.buttonPress();
  }, []);

  const handleTypeChange = useCallback((type: SearchType) => {
    haptics.selection();
    onFiltersChange({ ...filters, type });
  }, [filters, onFiltersChange]);

  const handleDateChange = useCallback((event: any, date?: Date) => {
    if (date) {
      if (showDatePicker === 'start') {
        setTempFilters(prev => ({ ...prev, customDateStart: date }));
      } else if (showDatePicker === 'end') {
        setTempFilters(prev => ({ ...prev, customDateEnd: date }));
      }
    }
    setShowDatePicker(null);
  }, [showDatePicker]);

  return (
    <View style={styles.container}>
      {/* Type Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.typePills}
      >
        {TYPE_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.typePill,
              { 
                backgroundColor: filters.type === option.value 
                  ? colors.primary 
                  : colors.backgroundSecondary,
                borderColor: filters.type === option.value 
                  ? colors.primary 
                  : colors.border,
              },
            ]}
            onPress={() => handleTypeChange(option.value)}
          >
            <Ionicons
              name={option.icon as any}
              size={16}
              color={filters.type === option.value ? 'white' : colors.textSecondary}
            />
            <ThemedText
              style={[
                styles.typePillText,
                { color: filters.type === option.value ? 'white' : colors.textPrimary },
              ]}
            >
              {option.label}
            </ThemedText>
          </TouchableOpacity>
        ))}

        {/* Filter Button */}
        <TouchableOpacity
          style={[
            styles.filterButton,
            { 
              backgroundColor: activeFilterCount > 0 ? colors.primary + '15' : colors.backgroundSecondary,
              borderColor: activeFilterCount > 0 ? colors.primary : colors.border,
            },
          ]}
          onPress={handleOpenFilters}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={activeFilterCount > 0 ? colors.primary : colors.textSecondary}
          />
          {activeFilterCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
              <ThemedText style={styles.filterBadgeText}>{activeFilterCount}</ThemedText>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Filters Modal */}
      <Modal
        visible={showFiltersModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFiltersModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
              <ThemedText style={[styles.modalCancel, { color: colors.textSecondary }]}>
                Cancel
              </ThemedText>
            </TouchableOpacity>
            <ThemedText style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Filters
            </ThemedText>
            <TouchableOpacity onPress={handleResetFilters}>
              <ThemedText style={[styles.modalReset, { color: colors.primary }]}>
                Reset
              </ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Date Range */}
            <View style={styles.filterSection}>
              <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                DATE RANGE
              </ThemedText>
              <View style={[styles.optionsContainer, { backgroundColor: colors.surface }]}>
                {DATE_OPTIONS.map((option, index) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionItem,
                      index < DATE_OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                    ]}
                    onPress={() => {
                      haptics.selection();
                      setTempFilters(prev => ({ ...prev, dateRange: option.value }));
                    }}
                  >
                    <ThemedText style={[styles.optionText, { color: colors.textPrimary }]}>
                      {option.label}
                    </ThemedText>
                    {tempFilters.dateRange === option.value && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom Date Pickers */}
              {tempFilters.dateRange === 'custom' && (
                <View style={styles.customDateContainer}>
                  <TouchableOpacity
                    style={[styles.datePickerButton, { backgroundColor: colors.surface }]}
                    onPress={() => setShowDatePicker('start')}
                  >
                    <ThemedText style={{ color: colors.textSecondary }}>From:</ThemedText>
                    <ThemedText style={{ color: colors.textPrimary }}>
                      {tempFilters.customDateStart?.toLocaleDateString() || 'Select date'}
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.datePickerButton, { backgroundColor: colors.surface }]}
                    onPress={() => setShowDatePicker('end')}
                  >
                    <ThemedText style={{ color: colors.textSecondary }}>To:</ThemedText>
                    <ThemedText style={{ color: colors.textPrimary }}>
                      {tempFilters.customDateEnd?.toLocaleDateString() || 'Select date'}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Sort By */}
            <View style={styles.filterSection}>
              <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                SORT BY
              </ThemedText>
              <View style={[styles.optionsContainer, { backgroundColor: colors.surface }]}>
                {SORT_OPTIONS.map((option, index) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionItem,
                      index < SORT_OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                    ]}
                    onPress={() => {
                      haptics.selection();
                      setTempFilters(prev => ({ ...prev, sortBy: option.value }));
                    }}
                  >
                    <ThemedText style={[styles.optionText, { color: colors.textPrimary }]}>
                      {option.label}
                    </ThemedText>
                    {tempFilters.sortBy === option.value && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Room Filter (if applicable) */}
            {rooms.length > 0 && (tempFilters.type === 'all' || tempFilters.type === 'posts') && (
              <View style={styles.filterSection}>
                <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  ROOM
                </ThemedText>
                <View style={[styles.optionsContainer, { backgroundColor: colors.surface }]}>
                  <TouchableOpacity
                    style={[styles.optionItem, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                    onPress={() => {
                      haptics.selection();
                      setTempFilters(prev => ({ ...prev, roomId: undefined }));
                    }}
                  >
                    <ThemedText style={[styles.optionText, { color: colors.textPrimary }]}>
                      All rooms
                    </ThemedText>
                    {!tempFilters.roomId && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                  {rooms.slice(0, 10).map((room, index) => (
                    <TouchableOpacity
                      key={room.id}
                      style={[
                        styles.optionItem,
                        index < Math.min(rooms.length, 10) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                      ]}
                      onPress={() => {
                        haptics.selection();
                        setTempFilters(prev => ({ ...prev, roomId: room.id }));
                      }}
                    >
                      <ThemedText style={[styles.optionText, { color: colors.textPrimary }]}>
                        {room.name}
                      </ThemedText>
                      {tempFilters.roomId === room.id && (
                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Additional Options */}
            <View style={styles.filterSection}>
              <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                OPTIONS
              </ThemedText>
              <View style={[styles.optionsContainer, { backgroundColor: colors.surface }]}>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    haptics.toggle();
                    setTempFilters(prev => ({ ...prev, verified: !prev.verified }));
                  }}
                >
                  <ThemedText style={[styles.optionText, { color: colors.textPrimary }]}>
                    Verified users only
                  </ThemedText>
                  <Ionicons
                    name={tempFilters.verified ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={tempFilters.verified ? colors.primary : colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Apply Button */}
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={handleApplyFilters}
            >
              <ThemedText style={styles.applyButtonText}>Apply Filters</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={
              showDatePicker === 'start'
                ? tempFilters.customDateStart || new Date()
                : tempFilters.customDateEnd || new Date()
            }
            mode="date"
            display="spinner"
            onChange={handleDateChange}
          />
        )}
      </Modal>
    </View>
  );
}

// Active filter tags component
interface ActiveFilterTagsProps {
  filters: SearchFilters;
  onRemoveFilter: (key: keyof SearchFilters) => void;
}

export function ActiveFilterTags({ filters, onRemoveFilter }: ActiveFilterTagsProps) {
  const { colors } = useThemeContext();
  const tags: { key: keyof SearchFilters; label: string }[] = [];

  if (filters.dateRange !== 'any') {
    const dateLabel = DATE_OPTIONS.find(d => d.value === filters.dateRange)?.label || filters.dateRange;
    tags.push({ key: 'dateRange', label: dateLabel });
  }
  if (filters.sortBy !== 'relevance') {
    const sortLabel = SORT_OPTIONS.find(s => s.value === filters.sortBy)?.label || filters.sortBy;
    tags.push({ key: 'sortBy', label: sortLabel });
  }
  if (filters.verified) {
    tags.push({ key: 'verified', label: 'Verified only' });
  }

  if (tags.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.activeTagsContainer}
    >
      {tags.map((tag) => (
        <TouchableOpacity
          key={tag.key}
          style={[styles.activeTag, { backgroundColor: colors.primary + '15' }]}
          onPress={() => {
            haptics.buttonPress();
            onRemoveFilter(tag.key);
          }}
        >
          <ThemedText style={[styles.activeTagText, { color: colors.primary }]}>
            {tag.label}
          </ThemedText>
          <Ionicons name="close-circle" size={16} color={colors.primary} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {},
  typePills: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 6,
  },
  typePillText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    ...Typography.small,
    fontSize: 10,
    color: 'white',
    fontWeight: '700',
  },

  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalCancel: {
    ...Typography.body,
  },
  modalTitle: {
    ...Typography.heading,
  },
  modalReset: {
    ...Typography.body,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  modalFooter: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  applyButton: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  applyButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },

  // Filter sections
  filterSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.small,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  optionsContainer: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.card,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  optionText: {
    ...Typography.body,
  },
  customDateContainer: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },

  // Active tags
  activeTagsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  activeTagText: {
    ...Typography.small,
    fontWeight: '500',
  },
});
