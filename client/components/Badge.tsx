import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { colors, typography, spacing, layout } from '@/theme';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'outline';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  /** Badge text */
  children: string;
  /** Visual variant */
  variant?: BadgeVariant;
  /** Size preset */
  size?: BadgeSize;
  /** Icon name (Feather) before text */
  icon?: keyof typeof Feather.glyphMap;
  /** Dot indicator instead of text */
  dot?: boolean;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
  /** Custom text style */
  textStyle?: StyleProp<TextStyle>;
}

const SIZE_CONFIG = {
  sm: {
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
    fontSize: 10,
    iconSize: 10,
    dotSize: 6,
  },
  md: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    fontSize: 11,
    iconSize: 12,
    dotSize: 8,
  },
  lg: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: 12,
    iconSize: 14,
    dotSize: 10,
  },
};

const VARIANT_STYLES: Record<
  BadgeVariant,
  { backgroundColor: string; textColor: string; borderColor?: string }
> = {
  default: {
    backgroundColor: colors.background.secondary,
    textColor: colors.text.secondary,
  },
  primary: {
    backgroundColor: colors.transparent.primary10,
    textColor: colors.primary.main,
  },
  secondary: {
    backgroundColor: colors.transparent.secondary10,
    textColor: colors.secondary.main,
  },
  success: {
    backgroundColor: 'rgba(0, 168, 107, 0.1)',
    textColor: colors.semantic.success,
  },
  warning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    textColor: colors.semantic.warning,
  },
  error: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    textColor: colors.semantic.error,
  },
  info: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    textColor: '#3B82F6',
  },
  outline: {
    backgroundColor: 'transparent',
    textColor: colors.text.secondary,
    borderColor: colors.border.medium,
  },
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  icon,
  dot = false,
  style,
  textStyle,
}: BadgeProps) {
  const sizeConfig = SIZE_CONFIG[size];
  const variantStyle = VARIANT_STYLES[variant];

  if (dot) {
    return (
      <View
        style={[
          styles.dot,
          {
            width: sizeConfig.dotSize,
            height: sizeConfig.dotSize,
            borderRadius: sizeConfig.dotSize / 2,
            backgroundColor: variantStyle.textColor,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: variantStyle.backgroundColor,
          paddingVertical: sizeConfig.paddingVertical,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          borderWidth: variantStyle.borderColor ? 1 : 0,
          borderColor: variantStyle.borderColor,
        },
        style,
      ]}
    >
      {icon && (
        <Feather
          name={icon}
          size={sizeConfig.iconSize}
          color={variantStyle.textColor}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.text,
          {
            fontSize: sizeConfig.fontSize,
            color: variantStyle.textColor,
          },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

// Notification Badge (numeric)
export interface NotificationBadgeProps {
  /** Count to display */
  count: number;
  /** Maximum count before showing + */
  max?: number;
  /** Size preset */
  size?: 'sm' | 'md';
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
}

export function NotificationBadge({
  count,
  max = 99,
  size = 'md',
  style,
}: NotificationBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();
  const isSmall = size === 'sm';
  const minWidth = displayCount.length > 2 ? (isSmall ? 20 : 24) : isSmall ? 16 : 20;

  return (
    <View
      style={[
        styles.notificationBadge,
        {
          minWidth,
          height: isSmall ? 16 : 20,
          paddingHorizontal: isSmall ? 4 : 6,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.notificationText,
          { fontSize: isSmall ? 10 : 11 },
        ]}
      >
        {displayCount}
      </Text>
    </View>
  );
}

// Status Badge with dot
export interface StatusBadgeProps {
  /** Status text */
  label: string;
  /** Status type */
  status: 'success' | 'warning' | 'error' | 'info' | 'default';
  /** Size preset */
  size?: BadgeSize;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
}

const STATUS_COLORS = {
  success: colors.semantic.success,
  warning: colors.semantic.warning,
  error: colors.semantic.error,
  info: '#3B82F6',
  default: colors.text.tertiary,
};

export function StatusBadge({
  label,
  status = 'default',
  size = 'md',
  style,
}: StatusBadgeProps) {
  const sizeConfig = SIZE_CONFIG[size];
  const dotColor = STATUS_COLORS[status];

  return (
    <View
      style={[
        styles.statusContainer,
        {
          paddingVertical: sizeConfig.paddingVertical,
          paddingHorizontal: sizeConfig.paddingHorizontal,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.statusDot,
          {
            width: sizeConfig.dotSize,
            height: sizeConfig.dotSize,
            borderRadius: sizeConfig.dotSize / 2,
            backgroundColor: dotColor,
          },
        ]}
      />
      <Text
        style={[
          styles.statusText,
          { fontSize: sizeConfig.fontSize },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: layout.radiusFull,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  icon: {
    marginRight: spacing.xs,
  },
  dot: {
    // Dot badge
  },

  // Notification Badge
  notificationBadge: {
    backgroundColor: colors.semantic.error,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: colors.text.inverse,
    fontWeight: '700',
  },

  // Status Badge
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: layout.radiusFull,
    alignSelf: 'flex-start',
  },
  statusDot: {
    marginRight: spacing.xs,
  },
  statusText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '500',
  },
});

export default Badge;
