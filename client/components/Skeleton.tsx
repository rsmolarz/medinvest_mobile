import React, { useEffect } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, spacing, layout } from '@/theme';

export interface SkeletonProps {
  /** Width (number for pixels, string for percentage) */
  width?: number | string;
  /** Height in pixels */
  height?: number;
  /** Border radius */
  borderRadius?: number;
  /** Circle shape (overrides width/height/borderRadius) */
  circle?: boolean;
  /** Circle/square size when using circle prop */
  size?: number;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = layout.radiusSmall,
  circle = false,
  size = 40,
  style,
}: SkeletonProps) {
  const shimmerPosition = useSharedValue(0);

  useEffect(() => {
    shimmerPosition.value = withRepeat(
      withTiming(1, {
        duration: 1500,
        easing: Easing.bezier(0.4, 0, 0.6, 1),
      }),
      -1, // Infinite repeat
      false // Don't reverse
    );
  }, [shimmerPosition]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerPosition.value,
      [0, 1],
      [-100, 100]
    );
    return {
      transform: [{ translateX: `${translateX}%` as any }],
    };
  });

  const containerStyle = circle
    ? {
        width: size,
        height: size,
        borderRadius: size / 2,
      }
    : {
        width,
        height,
        borderRadius,
      };

  return (
    <View style={[styles.container, containerStyle, style]}>
      <Animated.View style={[styles.shimmer, animatedStyle]}>
        <LinearGradient
          colors={[
            'transparent',
            'rgba(255, 255, 255, 0.3)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}

// Skeleton Text (multiple lines)
export interface SkeletonTextProps {
  /** Number of lines */
  lines?: number;
  /** Line height */
  lineHeight?: number;
  /** Gap between lines */
  gap?: number;
  /** Last line width percentage */
  lastLineWidth?: number | string;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
}

export function SkeletonText({
  lines = 3,
  lineHeight = 14,
  gap = spacing.sm,
  lastLineWidth = '60%',
  style,
}: SkeletonTextProps) {
  return (
    <View style={[styles.textContainer, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={lineHeight}
          style={index < lines - 1 ? { marginBottom: gap } : undefined}
        />
      ))}
    </View>
  );
}

// Skeleton Avatar
export interface SkeletonAvatarProps {
  /** Avatar size */
  size?: number;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
}

export function SkeletonAvatar({ size = 40, style }: SkeletonAvatarProps) {
  return <Skeleton circle size={size} style={style} />;
}

// Skeleton Card
export interface SkeletonCardProps {
  /** Show image placeholder */
  hasImage?: boolean;
  /** Image height */
  imageHeight?: number;
  /** Number of text lines */
  lines?: number;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
}

export function SkeletonCard({
  hasImage = true,
  imageHeight = 160,
  lines = 2,
  style,
}: SkeletonCardProps) {
  return (
    <View style={[styles.card, style]}>
      {hasImage && (
        <Skeleton
          width="100%"
          height={imageHeight}
          borderRadius={0}
          style={styles.cardImage}
        />
      )}
      <View style={styles.cardContent}>
        <Skeleton width="70%" height={18} style={styles.cardTitle} />
        <SkeletonText lines={lines} lineHeight={12} />
      </View>
    </View>
  );
}

// Skeleton List Item
export interface SkeletonListItemProps {
  /** Show avatar */
  hasAvatar?: boolean;
  /** Avatar size */
  avatarSize?: number;
  /** Number of text lines */
  lines?: number;
  /** Show right element placeholder */
  hasRightElement?: boolean;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
}

export function SkeletonListItem({
  hasAvatar = true,
  avatarSize = 48,
  lines = 2,
  hasRightElement = false,
  style,
}: SkeletonListItemProps) {
  return (
    <View style={[styles.listItem, style]}>
      {hasAvatar && (
        <SkeletonAvatar size={avatarSize} style={styles.listItemAvatar} />
      )}
      <View style={styles.listItemContent}>
        <Skeleton width="60%" height={14} style={styles.listItemTitle} />
        {lines > 1 && <Skeleton width="40%" height={12} />}
      </View>
      {hasRightElement && (
        <Skeleton width={60} height={24} borderRadius={layout.radiusSmall} />
      )}
    </View>
  );
}

// Skeleton Investment Card
export function SkeletonInvestmentCard({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.investmentCard, style]}>
      {/* Header */}
      <View style={styles.investmentHeader}>
        <Skeleton width={80} height={20} borderRadius={layout.radiusFull} />
        <Skeleton width={70} height={20} borderRadius={layout.radiusFull} />
      </View>

      {/* Content */}
      <View style={styles.investmentContent}>
        <Skeleton width="80%" height={20} style={styles.investmentTitle} />
        <SkeletonText lines={2} lineHeight={12} />
      </View>

      {/* Progress */}
      <Skeleton width="100%" height={8} style={styles.investmentProgress} />

      {/* Footer */}
      <View style={styles.investmentFooter}>
        <Skeleton width={80} height={14} />
        <Skeleton width={80} height={14} />
      </View>
    </View>
  );
}

// Skeleton Article Card
export function SkeletonArticleCard({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.articleCard, style]}>
      <Skeleton
        width={72}
        height={72}
        borderRadius={layout.radiusMedium}
        style={styles.articleImage}
      />
      <View style={styles.articleContent}>
        <View style={styles.articleMeta}>
          <Skeleton width={60} height={12} />
          <Skeleton width={40} height={12} />
        </View>
        <Skeleton width="90%" height={16} style={styles.articleTitle} />
        <Skeleton width="70%" height={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.border.light,
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
  },

  // Text
  textContainer: {
    width: '100%',
  },

  // Card
  card: {
    backgroundColor: colors.surface.primary,
    borderRadius: layout.radiusLarge,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cardImage: {
    marginBottom: 0,
  },
  cardContent: {
    padding: spacing.md,
  },
  cardTitle: {
    marginBottom: spacing.sm,
  },

  // List Item
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  listItemAvatar: {
    marginRight: spacing.md,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    marginBottom: spacing.xs,
  },

  // Investment Card
  investmentCard: {
    backgroundColor: colors.primary.main,
    borderRadius: layout.radiusLarge,
    padding: spacing.lg,
  },
  investmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  investmentContent: {
    marginBottom: spacing.lg,
  },
  investmentTitle: {
    marginBottom: spacing.sm,
  },
  investmentProgress: {
    marginBottom: spacing.md,
  },
  investmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  // Article Card
  articleCard: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.surface.primary,
    borderRadius: layout.radiusMedium,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  articleImage: {
    marginRight: spacing.md,
  },
  articleContent: {
    flex: 1,
    justifyContent: 'center',
  },
  articleMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  articleTitle: {
    marginBottom: spacing.xs,
  },
});

export default Skeleton;
