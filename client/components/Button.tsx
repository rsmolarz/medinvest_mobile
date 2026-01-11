import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { colors, typography, spacing, layout } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  /** Button text */
  children: string;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size preset */
  size?: ButtonSize;
  /** Show loading spinner */
  loading?: boolean;
  /** Disable button */
  disabled?: boolean;
  /** Icon name (Feather) to show before text */
  leftIcon?: keyof typeof Feather.glyphMap;
  /** Icon name (Feather) to show after text */
  rightIcon?: keyof typeof Feather.glyphMap;
  /** Full width button */
  fullWidth?: boolean;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
  /** Custom text style */
  textStyle?: StyleProp<TextStyle>;
}

const SIZES = {
  sm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    iconSize: 16,
    gap: spacing.xs,
  },
  md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    iconSize: 18,
    gap: spacing.sm,
  },
  lg: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    iconSize: 20,
    gap: spacing.sm,
  },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  textStyle,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const scale = useSharedValue(1);
  const sizeConfig = SIZES[size];
  const isDisabled = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: any) => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    onPressOut?.(e);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          container: [
            styles.container,
            styles.primaryContainer,
            isDisabled && styles.disabledContainer,
          ],
          text: [styles.text, styles.primaryText],
          iconColor: colors.text.inverse,
        };
      case 'secondary':
        return {
          container: [
            styles.container,
            styles.secondaryContainer,
            isDisabled && styles.disabledSecondaryContainer,
          ],
          text: [styles.text, styles.secondaryText],
          iconColor: colors.primary.main,
        };
      case 'outline':
        return {
          container: [
            styles.container,
            styles.outlineContainer,
            isDisabled && styles.disabledOutlineContainer,
          ],
          text: [styles.text, styles.outlineText],
          iconColor: colors.primary.main,
        };
      case 'ghost':
        return {
          container: [styles.container, styles.ghostContainer],
          text: [styles.text, styles.ghostText],
          iconColor: colors.primary.main,
        };
      case 'danger':
        return {
          container: [
            styles.container,
            styles.dangerContainer,
            isDisabled && styles.disabledContainer,
          ],
          text: [styles.text, styles.dangerText],
          iconColor: colors.text.inverse,
        };
      case 'gradient':
        return {
          container: [styles.container],
          text: [styles.text, styles.gradientText],
          iconColor: colors.text.inverse,
        };
      default:
        return {
          container: [styles.container],
          text: [styles.text],
          iconColor: colors.text.primary,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const textSizeStyle = size === 'sm' ? typography.button.small : size === 'lg' ? typography.button.large : typography.button.medium;

  const renderContent = () => (
    <View style={[styles.content, { gap: sizeConfig.gap }]}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyles.iconColor}
        />
      ) : (
        <>
          {leftIcon && (
            <Feather
              name={leftIcon}
              size={sizeConfig.iconSize}
              color={isDisabled ? colors.text.tertiary : variantStyles.iconColor}
            />
          )}
          <Text
            style={[
              variantStyles.text,
              textSizeStyle,
              isDisabled && styles.disabledText,
              textStyle,
            ]}
          >
            {children}
          </Text>
          {rightIcon && (
            <Feather
              name={rightIcon}
              size={sizeConfig.iconSize}
              color={isDisabled ? colors.text.tertiary : variantStyles.iconColor}
            />
          )}
        </>
      )}
    </View>
  );

  const containerStyle = [
    variantStyles.container,
    {
      paddingVertical: sizeConfig.paddingVertical,
      paddingHorizontal: sizeConfig.paddingHorizontal,
    },
    fullWidth && styles.fullWidth,
    style,
  ];

  if (variant === 'gradient' && !isDisabled) {
    return (
      <AnimatedPressable
        style={[animatedStyle, fullWidth && styles.fullWidth]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        {...props}
      >
        <LinearGradient
          colors={colors.gradient.colors as unknown as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.container,
            styles.gradientContainer,
            {
              paddingVertical: sizeConfig.paddingVertical,
              paddingHorizontal: sizeConfig.paddingHorizontal,
            },
            style,
          ]}
        >
          {renderContent()}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      style={[animatedStyle, containerStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      {...props}
    >
      {renderContent()}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: layout.radiusMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    textAlign: 'center',
  },

  // Primary
  primaryContainer: {
    backgroundColor: colors.primary.main,
  },
  primaryText: {
    color: colors.text.inverse,
  },

  // Secondary
  secondaryContainer: {
    backgroundColor: colors.transparent.primary10,
  },
  secondaryText: {
    color: colors.primary.main,
  },
  disabledSecondaryContainer: {
    backgroundColor: colors.background.secondary,
  },

  // Outline
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary.main,
  },
  outlineText: {
    color: colors.primary.main,
  },
  disabledOutlineContainer: {
    borderColor: colors.border.light,
  },

  // Ghost
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: colors.primary.main,
  },

  // Danger
  dangerContainer: {
    backgroundColor: colors.semantic.error,
  },
  dangerText: {
    color: colors.text.inverse,
  },

  // Gradient
  gradientContainer: {
    overflow: 'hidden',
  },
  gradientText: {
    color: colors.text.inverse,
  },

  // Disabled
  disabledContainer: {
    backgroundColor: colors.border.light,
  },
  disabledText: {
    color: colors.text.tertiary,
  },
});

export default Button;
