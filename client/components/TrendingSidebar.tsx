/**
 * TrendingSidebar Component
 * Shows trending hashtags and topics as a modal/sidebar
 */

import React, { memo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';
import { TrendingTopic } from '@/types';
import { formatNumber } from '@/lib/utils';

const { width, height } = Dimensions.get('window');

interface TrendingSidebarProps {
  topics: TrendingTopic[];
  onTopicPress: (tag: string) => void;
  onClose: () => void;
}

function TrendingSidebar({ topics, onTopicPress, onClose }: TrendingSidebarProps) {
  const appColors = useAppColors();

  const renderTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <Ionicons name="trending-up" size={16} color={Colors.secondary} />;
      case 'down':
        return <Ionicons name="trending-down" size={16} color={appColors.error} />;
      default:
        return <Ionicons name="remove" size={16} color={appColors.textSecondary} />;
    }
  };

  const renderTopic = ({ item, index }: { item: TrendingTopic; index: number }) => (
    <TouchableOpacity
      style={[styles.topicItem, { borderBottomColor: appColors.border }]}
      onPress={() => {
        onTopicPress(item.hashtag);
        onClose();
      }}
    >
      <View style={styles.topicRank}>
        <ThemedText style={[styles.rankText, { color: appColors.textSecondary }]}>{index + 1}</ThemedText>
      </View>
      <View style={styles.topicInfo}>
        <View style={styles.topicHeader}>
          <ThemedText style={[styles.topicTag, { color: appColors.textPrimary }]}>#{item.hashtag}</ThemedText>
          {renderTrendIcon(item.trend)}
        </View>
        <ThemedText style={[styles.topicCount, { color: appColors.textSecondary }]}>
          {formatNumber(item.count)} posts
        </ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={20} color={appColors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={true}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      </Pressable>
      
      <View style={[styles.container, { backgroundColor: appColors.surface }]}>
        <View style={[styles.header, { borderBottomColor: appColors.border }]}>
          <View style={styles.headerLeft}>
            <Ionicons name="trending-up" size={24} color={Colors.primary} />
            <ThemedText style={[styles.headerTitle, { color: appColors.textPrimary }]}>Trending</ThemedText>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={appColors.textPrimary} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={topics}
          renderItem={renderTopic}
          keyExtractor={(item) => item.hashtag}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="analytics-outline" size={48} color={appColors.textSecondary} />
              <ThemedText style={[styles.emptyText, { color: appColors.textSecondary }]}>No trending topics yet</ThemedText>
            </View>
          }
        />

        <View style={[styles.footer, { borderTopColor: appColors.border }]}>
          <ThemedText style={[styles.footerText, { color: appColors.textSecondary }]}>
            Updated every 15 minutes
          </ThemedText>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: height * 0.7,
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    ...Typography.heading,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  listContent: {
    padding: Spacing.lg,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  topicRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  rankText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  topicInfo: {
    flex: 1,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  topicTag: {
    ...Typography.body,
    fontWeight: '600',
  },
  topicCount: {
    ...Typography.small,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    ...Typography.small,
  },
});

export default memo(TrendingSidebar);
