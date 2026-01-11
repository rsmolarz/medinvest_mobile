import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { colors, typography, spacing, layout } from '@/theme';
import Button, { type ButtonProps } from './Button';

export interface EmptyStateProps {
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Image source */
  image?: ImageSourcePropType;
  /** Icon name (Feather) - used if no image */
  icon?: keyof typeof Feather.glyphMap;
  /** Icon size */
  iconSize?: number;
  /** Icon color */
  iconColor?: string;
  /** Primary action button */
  primaryAction?: {
    label: string;
    onPress: () => void;
  } & Partial<ButtonProps>;
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onPress: () => void;
  } & Partial<ButtonProps>;
  /** Animate on mount */
  animated?: boolean;
  /** Compact mode (smaller spacing) */
  compact?: boolean;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  title,
  description,
  image,
  icon,
  iconSize = 64,
  iconColor,
  primaryAction,
  secondaryAction,
  animated = true,
  compact = false,
  style,
}: EmptyStateProps) {
  const Container = animated ? Animated.View : View;
  const animationProps = animated
    ? { entering: FadeIn.duration(400) }
    : {};

  return (
    <Container
      style={[
        styles.container,
        compact && styles.containerCompact,
        style,
      ]}
      {...animationProps}
    >
      {/* Image or Icon */}
      {image ? (
        <Image
          source={image}
          style={[
            styles.image,
            compact && styles.imageCompact,
          ]}
          resizeMode="contain"
        />
      ) : icon ? (
        <View
          style={[
            styles.iconContainer,
            compact && styles.iconContainerCompact,
          ]}
        >
          <Feather
            name={icon}
            size={iconSize}
            color={iconColor || colors.text.tertiary}
          />
        </View>
      ) : null}

      {/* Text Content */}
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.title,
            compact && styles.titleCompact,
          ]}
        >
          {title}
        </Text>
        
        {description && (
          <Text
            style={[
              styles.description,
              compact && styles.descriptionCompact,
            ]}
          >
            {description}
          </Text>
        )}
      </View>

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <View
          style={[
            styles.actionsContainer,
            compact && styles.actionsContainerCompact,
          ]}
        >
          {primaryAction && (
            <Button
              variant="primary"
              size={compact ? 'sm' : 'md'}
              {...primaryAction}
              onPress={primaryAction.onPress}
            >
              {primaryAction.label}
            </Button>
          )}
          
          {secondaryAction && (
            <Button
              variant="ghost"
              size={compact ? 'sm' : 'md'}
              {...secondaryAction}
              onPress={secondaryAction.onPress}
              style={primaryAction ? styles.secondaryButton : undefined}
            >
              {secondaryAction.label}
            </Button>
          )}
        </View>
      )}
    </Container>
  );
}

// Preset Empty States
export function EmptySearchState({
  query,
  onClear,
  ...props
}: Omit<EmptyStateProps, 'title' | 'description' | 'icon'> & {
  query?: string;
  onClear?: () => void;
}) {
  return (
    <EmptyState
      icon="search"
      title="No results found"
      description={
        query
          ? `We couldn't find anything matching "${query}". Try adjusting your search.`
          : 'Try searching for something else.'
      }
      primaryAction={
        onClear
          ? { label: 'Clear search', onPress: onClear, variant: 'outline' }
          : undefined
      }
      {...props}
    />
  );
}

export function EmptyListState({
  itemName = 'items',
  onCreate,
  ...props
}: Omit<EmptyStateProps, 'title' | 'description' | 'icon'> & {
  itemName?: string;
  onCreate?: () => void;
}) {
  return (
    <EmptyState
      icon="inbox"
      title={`No ${itemName} yet`}
      description={`When you have ${itemName}, they'll appear here.`}
      primaryAction={
        onCreate
          ? { label: `Add ${itemName}`, onPress: onCreate }
          : undefined
      }
      {...props}
    />
  );
}

export function EmptyNetworkState({
  onRetry,
  ...props
}: Omit<EmptyStateProps, 'title' | 'description' | 'icon'> & {
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon="wifi-off"
      title="No connection"
      description="Please check your internet connection and try again."
      primaryAction={
        onRetry
          ? { label: 'Try again', onPress: onRetry }
          : undefined
      }
      {...props}
    />
  );
}

export function EmptyErrorState({
  error,
  onRetry,
  ...props
}: Omit<EmptyStateProps, 'title' | 'description' | 'icon'> & {
  error?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon="alert-circle"
      iconColor={colors.semantic.error}
      title="Something went wrong"
      description={error || "We couldn't load this content. Please try again."}
      primaryAction={
        onRetry
          ? { label: 'Try again', onPress: onRetry }
          : undefined
      }
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['3xl'],
  },
  containerCompact: {
    paddingVertical: spacing.xl,
  },

  // Image
  image: {
    width: 200,
    height: 160,
    marginBottom: spacing.xl,
  },
  imageCompact: {
    width: 120,
    height: 96,
    marginBottom: spacing.lg,
  },

  // Icon
  iconContainer: {
    marginBottom: spacing.xl,
    opacity: 0.8,
  },
  iconContainerCompact: {
    marginBottom: spacing.lg,
  },

  // Text
  textContainer: {
    alignItems: 'center',
  },
  title: {
    ...typography.heading,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  titleCompact: {
    ...typography.bodyMedium,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  descriptionCompact: {
    ...typography.caption,
    lineHeight: 20,
    maxWidth: 240,
  },

  // Actions
  actionsContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionsContainerCompact: {
    marginTop: spacing.lg,
  },
  secondaryButton: {
    marginTop: spacing.xs,
  },
});

export default EmptyState;
