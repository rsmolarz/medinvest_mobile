import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { colors, typography, spacing } from '@/theme';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface AvatarProps {
  /** Image source (URL or require) */
  source?: ImageSourcePropType | string;
  /** User's name for initials fallback */
  name?: string;
  /** Size preset */
  size?: AvatarSize;
  /** Make avatar pressable */
  onPress?: () => void;
  /** Show edit badge */
  showEditBadge?: boolean;
  /** Show online indicator */
  showOnlineIndicator?: boolean;
  /** Is user online */
  isOnline?: boolean;
  /** Custom background color */
  backgroundColor?: string;
  /** Custom text color */
  textColor?: string;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
}

const SIZE_CONFIG = {
  xs: { size: 24, fontSize: 10, iconSize: 12, badgeSize: 12, borderWidth: 1 },
  sm: { size: 32, fontSize: 12, iconSize: 14, badgeSize: 14, borderWidth: 2 },
  md: { size: 40, fontSize: 14, iconSize: 16, badgeSize: 16, borderWidth: 2 },
  lg: { size: 56, fontSize: 18, iconSize: 20, badgeSize: 20, borderWidth: 2 },
  xl: { size: 72, fontSize: 24, iconSize: 28, badgeSize: 24, borderWidth: 3 },
  '2xl': { size: 100, fontSize: 32, iconSize: 40, badgeSize: 28, borderWidth: 3 },
};

/**
 * Get initials from name
 */
function getInitials(name?: string): string {
  if (!name) return '';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * Generate consistent color from name
 */
function getColorFromName(name?: string): string {
  if (!name) return colors.primary.main;
  
  const colorOptions = [
    colors.primary.main,
    colors.secondary.main,
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#3B82F6', // Blue
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colorOptions[Math.abs(hash) % colorOptions.length];
}

export function Avatar({
  source,
  name,
  size = 'md',
  onPress,
  showEditBadge = false,
  showOnlineIndicator = false,
  isOnline = false,
  backgroundColor,
  textColor,
  style,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const config = SIZE_CONFIG[size];
  const initials = getInitials(name);
  const bgColor = backgroundColor || getColorFromName(name);
  const txtColor = textColor || colors.text.inverse;

  const hasValidSource = source && !imageError;
  const imageSource = typeof source === 'string' ? { uri: source } : source;

  const containerStyle = [
    styles.container,
    {
      width: config.size,
      height: config.size,
      borderRadius: config.size / 2,
      backgroundColor: hasValidSource ? colors.background.secondary : bgColor,
    },
    style,
  ];

  const content = hasValidSource ? (
    <Image
      source={imageSource as ImageSourcePropType}
      style={[
        styles.image,
        {
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
        },
      ]}
      onError={() => setImageError(true)}
    />
  ) : initials ? (
    <Text
      style={[
        styles.initials,
        { fontSize: config.fontSize, color: txtColor },
      ]}
    >
      {initials}
    </Text>
  ) : (
    <Feather name="user" size={config.iconSize} color={txtColor} />
  );

  const avatar = (
    <View style={containerStyle}>
      {content}

      {/* Edit Badge */}
      {showEditBadge && (
        <View
          style={[
            styles.editBadge,
            {
              width: config.badgeSize,
              height: config.badgeSize,
              borderRadius: config.badgeSize / 2,
              borderWidth: config.borderWidth,
            },
          ]}
        >
          <Feather
            name="camera"
            size={config.badgeSize * 0.5}
            color={colors.text.inverse}
          />
        </View>
      )}

      {/* Online Indicator */}
      {showOnlineIndicator && (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: config.badgeSize * 0.6,
              height: config.badgeSize * 0.6,
              borderRadius: config.badgeSize * 0.3,
              borderWidth: config.borderWidth,
              backgroundColor: isOnline
                ? colors.semantic.success
                : colors.text.tertiary,
            },
          ]}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.pressable}>
        {avatar}
      </Pressable>
    );
  }

  return avatar;
}

// Avatar Group component
export interface AvatarGroupProps {
  /** Array of avatar data */
  avatars: Array<{ source?: string; name?: string }>;
  /** Maximum avatars to show */
  max?: number;
  /** Size of avatars */
  size?: AvatarSize;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
}

export function AvatarGroup({
  avatars,
  max = 4,
  size = 'md',
  style,
}: AvatarGroupProps) {
  const config = SIZE_CONFIG[size];
  const visibleAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;
  const overlap = config.size * 0.3;

  return (
    <View style={[styles.groupContainer, style]}>
      {visibleAvatars.map((avatar, index) => (
        <View
          key={index}
          style={[
            styles.groupAvatar,
            { marginLeft: index === 0 ? 0 : -overlap, zIndex: visibleAvatars.length - index },
          ]}
        >
          <Avatar
            source={avatar.source}
            name={avatar.name}
            size={size}
            style={styles.groupAvatarBorder}
          />
        </View>
      ))}
      
      {remaining > 0 && (
        <View
          style={[
            styles.remainingBadge,
            {
              width: config.size,
              height: config.size,
              borderRadius: config.size / 2,
              marginLeft: -overlap,
            },
          ]}
        >
          <Text
            style={[
              styles.remainingText,
              { fontSize: config.fontSize * 0.8 },
            ]}
          >
            +{remaining}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  pressable: {
    // Pressable wrapper
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    fontWeight: '600',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary.main,
    borderColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderColor: colors.background.primary,
  },

  // Avatar Group
  groupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupAvatar: {
    // Overlapping avatar
  },
  groupAvatarBorder: {
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  remainingBadge: {
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  remainingText: {
    ...typography.captionMedium,
    color: colors.text.secondary,
  },
});

export default Avatar;
