import React, { useEffect } from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, typography, spacing, layout } from '@/theme';

export type ProgressVariant = 'default' | 'gradient' | 'success' | 'warning' | 'error';
export type ProgressSize = 'sm' | 'md' | 'lg';

export interface ProgressBarProps {
  /** Progress value (0-100) */
  value: number;
  /** Maximum value */
  max?: number;
  /** Visual variant */
  variant?: ProgressVariant;
  /** Size preset */
  size?: ProgressSize;
  /** Show percentage label */
  showLabel?: boolean;
  /** Label position */
  labelPosition?: 'top' | 'right' | 'inside';
  /** Custom label formatter */
  formatLabel?: (value: number, max: number) => string;
  /** Animate on mount */
  animated?: boolean;
  /** Animation duration (ms) */
  animationDuration?: number;
  /** Custom track color */
  trackColor?: string;
  /** Custom fill color */
  fillColor?: string;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
}

const SIZE_CONFIG = {
  sm: { height: 4, borderRadius: 2, fontSize: 10 },
  md: { height: 8, borderRadius: 4, fontSize: 12 },
  lg: { height: 12, borderRadius: 6, fontSize: 14 },
};

const VARIANT_COLORS: Record<ProgressVariant, string | string[]> = {
  default: colors.primary.main,
  gradient: colors.gradient.colors as unknown as string[],
  success: colors.semantic.success,
  warning: colors.semantic.warning,
  error: colors.semantic.error,
};

export function ProgressBar({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  showLabel = false,
  labelPosition = 'right',
  formatLabel,
  animated = true,
  animationDuration = 800,
  trackColor,
  fillColor,
  style,
}: ProgressBarProps) {
  const progress = useSharedValue(animated ? 0 : Math.min(value, max));
  const sizeConfig = SIZE_CONFIG[size];
  const percentage = Math.min((value / max) * 100, 100);

  useEffect(() => {
    if (animated) {
      progress.value = withTiming(Math.min(value, max), {
        duration: animationDuration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    } else {
      progress.value = Math.min(value, max);
    }
  }, [value, max, animated, animationDuration, progress]);

  const animatedFillStyle = useAnimatedStyle(() => {
    const widthPercent = interpolate(progress.value, [0, max], [0, 100]);
    return {
      width: `${Math.min(widthPercent, 100)}%`,
    };
  });

  const label = formatLabel
    ? formatLabel(value, max)
    : `${Math.round(percentage)}%`;

  const getTrackColor = () => trackColor || colors.border.light;
  
  const getFillColor = () => {
    if (fillColor) return fillColor;
    const variantColor = VARIANT_COLORS[variant];
    return Array.isArray(variantColor) ? variantColor[0] : variantColor;
  };

  const isGradient = variant === 'gradient' && !fillColor;

  const renderFill = () => {
    if (isGradient) {
      return (
        <Animated.View style={[styles.fillWrapper, animatedFillStyle]}>
          <LinearGradient
            colors={colors.gradient.colors as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.gradientFill,
              { height: sizeConfig.height, borderRadius: sizeConfig.borderRadius },
            ]}
          />
        </Animated.View>
      );
    }

    return (
      <Animated.View
        style={[
          styles.fill,
          {
            height: sizeConfig.height,
            borderRadius: sizeConfig.borderRadius,
            backgroundColor: getFillColor(),
          },
          animatedFillStyle,
        ]}
      />
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Top Label */}
      {showLabel && labelPosition === 'top' && (
        <View style={styles.topLabelContainer}>
          <Text style={[styles.label, { fontSize: sizeConfig.fontSize }]}>
            {label}
          </Text>
        </View>
      )}

      <View style={styles.barContainer}>
        {/* Track */}
        <View
          style={[
            styles.track,
            {
              height: sizeConfig.height,
              borderRadius: sizeConfig.borderRadius,
              backgroundColor: getTrackColor(),
            },
          ]}
        >
          {/* Fill */}
          {renderFill()}

          {/* Inside Label */}
          {showLabel && labelPosition === 'inside' && size === 'lg' && (
            <View style={styles.insideLabelContainer}>
              <Text style={[styles.insideLabel, { fontSize: sizeConfig.fontSize - 2 }]}>
                {label}
              </Text>
            </View>
          )}
        </View>

        {/* Right Label */}
        {showLabel && labelPosition === 'right' && (
          <Text
            style={[
              styles.rightLabel,
              { fontSize: sizeConfig.fontSize, minWidth: 40 },
            ]}
          >
            {label}
          </Text>
        )}
      </View>
    </View>
  );
}

// Circular Progress
export interface CircularProgressProps {
  /** Progress value (0-100) */
  value: number;
  /** Size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Track color */
  trackColor?: string;
  /** Fill color */
  fillColor?: string;
  /** Show label in center */
  showLabel?: boolean;
  /** Custom label */
  label?: string;
  /** Animate on mount */
  animated?: boolean;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
  /** Children to render in center */
  children?: React.ReactNode;
}

export function CircularProgress({
  value,
  size = 80,
  strokeWidth = 8,
  trackColor,
  fillColor,
  showLabel = true,
  label,
  animated = true,
  style,
  children,
}: CircularProgressProps) {
  const progress = useSharedValue(animated ? 0 : value);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (animated) {
      progress.value = withSpring(Math.min(value, 100), {
        damping: 15,
        stiffness: 100,
      });
    } else {
      progress.value = Math.min(value, 100);
    }
  }, [value, animated, progress]);

  return (
    <View style={[styles.circularContainer, { width: size, height: size }, style]}>
      <View style={styles.svgContainer}>
        {/* Track Circle */}
        <View
          style={[
            styles.circleTrack,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: trackColor || colors.border.light,
            },
          ]}
        />
        
        {/* Progress indicator - simplified without SVG */}
        <Animated.View
          style={[
            styles.circleProgress,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: fillColor || colors.primary.main,
              borderTopColor: 'transparent',
              borderRightColor: 'transparent',
              transform: [{ rotate: `${(value / 100) * 360}deg` }],
            },
          ]}
        />
      </View>

      {/* Center Content */}
      <View style={styles.circularCenter}>
        {children || (showLabel && (
          <Text style={styles.circularLabel}>
            {label || `${Math.round(value)}%`}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Container
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  track: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  fillWrapper: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  gradientFill: {
    width: '100%',
    height: '100%',
  },

  // Labels
  topLabelContainer: {
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  rightLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
    marginLeft: spacing.sm,
    textAlign: 'right',
  },
  insideLabelContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insideLabel: {
    color: colors.text.inverse,
    fontWeight: '700',
  },

  // Circular
  circularContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgContainer: {
    position: 'absolute',
  },
  circleTrack: {
    position: 'absolute',
  },
  circleProgress: {
    position: 'absolute',
  },
  circularCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularLabel: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
});

export default ProgressBar;
