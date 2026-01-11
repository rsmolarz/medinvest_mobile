import React from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  type ViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { colors, spacing, layout, shadows } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'gradient' | 'flat';

export interface CardProps extends ViewProps {
  /** Visual variant */
  variant?: CardVariant;
  /** Make card pressable */
  onPress?: () => void;
  /** Disable press interaction */
  disabled?: boolean;
  /** Card padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Border radius size */
  radius?: 'sm' | 'md' | 'lg' | 'xl';
  /** Gradient colors (for gradient variant) */
  gradientColors?: string[];
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
  /** Content */
  children: React.ReactNode;
}

const PADDING = {
  none: 0,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
};

const RADIUS = {
  sm: layout.radiusSmall,
  md: layout.radiusMedium,
  lg: layout.radiusLarge,
  xl: layout.radiusXLarge,
};

export function Card({
  variant = 'default',
  onPress,
  disabled = false,
  padding = 'md',
  radius = 'lg',
  gradientColors,
  style,
  children,
  ...props
}: CardProps) {
  const scale = useSharedValue(1);
  const isInteractive = !!onPress && !disabled;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (isInteractive) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    }
  };

  const handlePressOut = () => {
    if (isInteractive) {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    }
  };

  const getVariantStyles = (): StyleProp<ViewStyle> => {
    switch (variant) {
      case 'elevated':
        return [styles.baseCard, styles.elevatedCard, shadows.elevated];
      case 'outlined':
        return [styles.baseCard, styles.outlinedCard];
      case 'flat':
        return [styles.baseCard, styles.flatCard];
      case 'gradient':
        return [styles.baseCard];
      case 'default':
      default:
        return [styles.baseCard, styles.defaultCard, shadows.card];
    }
  };

  const cardStyle = [
    getVariantStyles(),
    { padding: PADDING[padding], borderRadius: RADIUS[radius] },
    style,
  ];

  // Gradient variant
  if (variant === 'gradient') {
    const gradientColorsToUse = gradientColors || (colors.gradient.colors as unknown as string[]);

    if (isInteractive) {
      return (
        <AnimatedPressable
          style={animatedStyle}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
        >
          <LinearGradient
            colors={gradientColorsToUse}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              cardStyle,
              styles.gradientCard,
              { borderRadius: RADIUS[radius] },
            ]}
            {...props}
          >
            {children}
          </LinearGradient>
        </AnimatedPressable>
      );
    }

    return (
      <LinearGradient
        colors={gradientColorsToUse}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[cardStyle, styles.gradientCard, { borderRadius: RADIUS[radius] }]}
        {...props}
      >
        {children}
      </LinearGradient>
    );
  }

  // Interactive card
  if (isInteractive) {
    return (
      <AnimatedPressable
        style={[animatedStyle, cardStyle]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        {...props}
      >
        {children}
      </AnimatedPressable>
    );
  }

  // Static card
  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
}

// Card Header component
export interface CardHeaderProps extends ViewProps {
  children: React.ReactNode;
}

export function CardHeader({ children, style, ...props }: CardHeaderProps) {
  return (
    <View style={[styles.cardHeader, style]} {...props}>
      {children}
    </View>
  );
}

// Card Content component
export interface CardContentProps extends ViewProps {
  children: React.ReactNode;
}

export function CardContent({ children, style, ...props }: CardContentProps) {
  return (
    <View style={[styles.cardContent, style]} {...props}>
      {children}
    </View>
  );
}

// Card Footer component
export interface CardFooterProps extends ViewProps {
  children: React.ReactNode;
}

export function CardFooter({ children, style, ...props }: CardFooterProps) {
  return (
    <View style={[styles.cardFooter, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  baseCard: {
    overflow: 'hidden',
  },
  defaultCard: {
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  elevatedCard: {
    backgroundColor: colors.surface.primary,
  },
  outlinedCard: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  flatCard: {
    backgroundColor: colors.background.secondary,
  },
  gradientCard: {
    overflow: 'hidden',
  },

  // Sub-components
  cardHeader: {
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    marginBottom: spacing.md,
  },
  cardContent: {
    // Default content area
  },
  cardFooter: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    marginTop: spacing.md,
  },
});

export default Card;
