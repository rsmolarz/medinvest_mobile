import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';

import { colors, typography, spacing, layout } from '@/theme';

const AnimatedView = Animated.createAnimatedComponent(View);

export interface InputProps extends Omit<TextInputProps, 'style'> {
  /** Input label */
  label?: string;
  /** Helper text below input */
  helperText?: string;
  /** Error message (shows error state when present) */
  error?: string;
  /** Icon name (Feather) for left side */
  leftIcon?: keyof typeof Feather.glyphMap;
  /** Icon name (Feather) for right side */
  rightIcon?: keyof typeof Feather.glyphMap;
  /** Callback when right icon is pressed */
  onRightIconPress?: () => void;
  /** Show as disabled */
  disabled?: boolean;
  /** Show as read-only */
  readOnly?: boolean;
  /** Container style */
  containerStyle?: StyleProp<ViewStyle>;
  /** Input container style */
  inputContainerStyle?: StyleProp<ViewStyle>;
  /** Required field indicator */
  required?: boolean;
  /** Character count (shows count/max) */
  maxLength?: number;
  /** Show character count */
  showCharacterCount?: boolean;
}

export function Input({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  disabled = false,
  readOnly = false,
  containerStyle,
  inputContainerStyle,
  required = false,
  maxLength,
  showCharacterCount = false,
  value,
  onFocus,
  onBlur,
  secureTextEntry,
  ...props
}: InputProps) {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isSecureVisible, setIsSecureVisible] = useState(!secureTextEntry);
  const focusAnimation = useSharedValue(0);

  const hasError = !!error;
  const isDisabled = disabled || readOnly;
  const characterCount = value?.length || 0;

  const handleFocus = useCallback(
    (e: any) => {
      setIsFocused(true);
      focusAnimation.value = withTiming(1, { duration: 150 });
      onFocus?.(e);
    },
    [onFocus, focusAnimation]
  );

  const handleBlur = useCallback(
    (e: any) => {
      setIsFocused(false);
      focusAnimation.value = withTiming(0, { duration: 150 });
      onBlur?.(e);
    },
    [onBlur, focusAnimation]
  );

  const handleContainerPress = useCallback(() => {
    if (!isDisabled) {
      inputRef.current?.focus();
    }
  }, [isDisabled]);

  const toggleSecureVisibility = useCallback(() => {
    setIsSecureVisible((prev) => !prev);
  }, []);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const borderColor = hasError
      ? colors.semantic.error
      : interpolateColor(
          focusAnimation.value,
          [0, 1],
          [colors.border.light, colors.primary.main]
        );

    return {
      borderColor,
      borderWidth: isFocused ? 1.5 : 1,
    };
  });

  const getBorderColor = () => {
    if (hasError) return colors.semantic.error;
    if (isFocused) return colors.primary.main;
    return colors.border.light;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <View style={styles.labelContainer}>
          <Text
            style={[
              styles.label,
              isFocused && styles.labelFocused,
              hasError && styles.labelError,
            ]}
          >
            {label}
          </Text>
          {required && <Text style={styles.required}>*</Text>}
        </View>
      )}

      {/* Input Container */}
      <Pressable onPress={handleContainerPress} disabled={isDisabled}>
        <AnimatedView
          style={[
            styles.inputContainer,
            animatedContainerStyle,
            isDisabled && styles.inputContainerDisabled,
            inputContainerStyle,
          ]}
        >
          {/* Left Icon */}
          {leftIcon && (
            <Feather
              name={leftIcon}
              size={20}
              color={
                hasError
                  ? colors.semantic.error
                  : isFocused
                  ? colors.primary.main
                  : colors.text.tertiary
              }
              style={styles.leftIcon}
            />
          )}

          {/* Text Input */}
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              isDisabled && styles.inputDisabled,
              leftIcon && styles.inputWithLeftIcon,
              (rightIcon || secureTextEntry) && styles.inputWithRightIcon,
            ]}
            value={value}
            placeholderTextColor={colors.text.tertiary}
            editable={!isDisabled}
            onFocus={handleFocus}
            onBlur={handleBlur}
            secureTextEntry={secureTextEntry && !isSecureVisible}
            maxLength={maxLength}
            {...props}
          />

          {/* Right Icon / Secure Toggle */}
          {secureTextEntry ? (
            <Pressable
              onPress={toggleSecureVisibility}
              style={styles.rightIconButton}
              hitSlop={8}
            >
              <Feather
                name={isSecureVisible ? 'eye-off' : 'eye'}
                size={20}
                color={colors.text.tertiary}
              />
            </Pressable>
          ) : rightIcon ? (
            <Pressable
              onPress={onRightIconPress}
              style={styles.rightIconButton}
              hitSlop={8}
              disabled={!onRightIconPress}
            >
              <Feather
                name={rightIcon}
                size={20}
                color={
                  hasError
                    ? colors.semantic.error
                    : isFocused
                    ? colors.primary.main
                    : colors.text.tertiary
                }
              />
            </Pressable>
          ) : null}
        </AnimatedView>
      </Pressable>

      {/* Footer: Helper Text / Error / Character Count */}
      <View style={styles.footer}>
        {(helperText || error) && (
          <Text
            style={[
              styles.helperText,
              hasError && styles.errorText,
            ]}
          >
            {error || helperText}
          </Text>
        )}
        {showCharacterCount && maxLength && (
          <Text
            style={[
              styles.characterCount,
              characterCount >= maxLength && styles.characterCountMax,
            ]}
          >
            {characterCount}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },

  // Label
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.captionMedium,
    color: colors.text.primary,
  },
  labelFocused: {
    color: colors.primary.main,
  },
  labelError: {
    color: colors.semantic.error,
  },
  required: {
    ...typography.caption,
    color: colors.semantic.error,
    marginLeft: spacing.xs,
  },

  // Input Container
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    borderRadius: layout.radiusMedium,
    borderWidth: 1,
    borderColor: colors.border.light,
    minHeight: layout.inputHeight,
  },
  inputContainerDisabled: {
    backgroundColor: colors.background.secondary,
  },

  // Icons
  leftIcon: {
    marginLeft: spacing.md,
  },
  rightIconButton: {
    padding: spacing.md,
  },

  // Input
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  inputDisabled: {
    color: colors.text.secondary,
  },
  inputWithLeftIcon: {
    paddingLeft: spacing.sm,
  },
  inputWithRightIcon: {
    paddingRight: spacing.xs,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    minHeight: 18,
  },
  helperText: {
    ...typography.small,
    color: colors.text.secondary,
    flex: 1,
  },
  errorText: {
    color: colors.semantic.error,
  },
  characterCount: {
    ...typography.small,
    color: colors.text.tertiary,
    marginLeft: spacing.sm,
  },
  characterCountMax: {
    color: colors.semantic.error,
  },
});

export default Input;
