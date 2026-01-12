/**
 * Mention Autocomplete Component
 * @user suggestions while typing
 */

import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  Keyboard,
  Platform,
  TextInputProps,
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useThemeContext } from '@/contexts/ThemeContext';
import { usersApi } from '@/lib/api';
import { haptics } from '@/lib/haptics';

// User suggestion type
interface UserSuggestion {
  id: number;
  full_name: string;
  username?: string;
  avatar_url?: string;
  specialty?: string;
}

interface MentionInputProps extends Omit<TextInputProps, 'onChangeText'> {
  value: string;
  onChangeText: (text: string) => void;
  onMentionSelect?: (user: UserSuggestion) => void;
  suggestionsPosition?: 'above' | 'below';
  maxSuggestions?: number;
}

export default function MentionInput({
  value,
  onChangeText,
  onMentionSelect,
  suggestionsPosition = 'above',
  maxSuggestions = 5,
  ...textInputProps
}: MentionInputProps) {
  const { colors } = useThemeContext();
  const inputRef = useRef<TextInput>(null);
  
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState<number>(-1);
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const suggestionsHeight = useSharedValue(0);

  // Search for users when mention query changes
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['mentionSuggestions', mentionQuery],
    queryFn: async () => {
      if (!mentionQuery || mentionQuery.length < 1) return [];
      const response = await usersApi.search(mentionQuery);
      return (response.data?.users || []).slice(0, maxSuggestions);
    },
    enabled: !!mentionQuery && mentionQuery.length >= 1,
    staleTime: 30000,
  });

  // Detect @ mentions while typing
  const detectMention = useCallback((text: string, cursor: number) => {
    // Find the @ before cursor
    let atIndex = -1;
    for (let i = cursor - 1; i >= 0; i--) {
      const char = text[i];
      if (char === '@') {
        atIndex = i;
        break;
      }
      // Stop if we hit a space or newline (not part of mention)
      if (char === ' ' || char === '\n') {
        break;
      }
    }

    if (atIndex !== -1) {
      const query = text.substring(atIndex + 1, cursor);
      // Valid mention query (no spaces, reasonable length)
      if (query.length <= 30 && !/\s/.test(query)) {
        setMentionQuery(query);
        setMentionStartIndex(atIndex);
        setShowSuggestions(true);
        return;
      }
    }

    // No valid mention found
    setMentionQuery(null);
    setMentionStartIndex(-1);
    setShowSuggestions(false);
  }, []);

  // Handle text changes
  const handleChangeText = useCallback((text: string) => {
    onChangeText(text);
    detectMention(text, cursorPosition);
  }, [onChangeText, detectMention, cursorPosition]);

  // Handle cursor position changes
  const handleSelectionChange = useCallback((
    event: NativeSyntheticEvent<TextInputSelectionChangeEventData>
  ) => {
    const { start } = event.nativeEvent.selection;
    setCursorPosition(start);
    detectMention(value, start);
  }, [value, detectMention]);

  // Handle selecting a mention
  const handleSelectMention = useCallback((user: UserSuggestion) => {
    haptics.selection();
    
    const username = user.username || user.full_name.toLowerCase().replace(/\s+/g, '');
    const beforeMention = value.substring(0, mentionStartIndex);
    const afterMention = value.substring(cursorPosition);
    const newText = `${beforeMention}@${username} ${afterMention}`;
    
    onChangeText(newText);
    setShowSuggestions(false);
    setMentionQuery(null);
    
    onMentionSelect?.(user);
    
    // Move cursor after the mention
    const newCursorPosition = mentionStartIndex + username.length + 2; // +2 for @ and space
    setTimeout(() => {
      inputRef.current?.setNativeProps({
        selection: { start: newCursorPosition, end: newCursorPosition },
      });
    }, 50);
  }, [value, mentionStartIndex, cursorPosition, onChangeText, onMentionSelect]);

  // Close suggestions when keyboard hides
  useEffect(() => {
    const hideListener = Keyboard.addListener('keyboardDidHide', () => {
      setShowSuggestions(false);
    });
    return () => hideListener.remove();
  }, []);

  // Animate suggestions container
  useEffect(() => {
    const targetHeight = showSuggestions && suggestions.length > 0 
      ? Math.min(suggestions.length * 56, 280) 
      : 0;
    suggestionsHeight.value = withTiming(targetHeight, { duration: 200 });
  }, [showSuggestions, suggestions.length]);

  const animatedSuggestionsStyle = useAnimatedStyle(() => ({
    height: suggestionsHeight.value,
    opacity: suggestionsHeight.value > 0 ? 1 : 0,
  }));

  const renderSuggestion = useCallback(({ item }: { item: UserSuggestion }) => (
    <MentionSuggestionItem
      user={item}
      onPress={() => handleSelectMention(item)}
      colors={colors}
    />
  ), [handleSelectMention, colors]);

  return (
    <View style={styles.container}>
      {/* Suggestions (above input) */}
      {suggestionsPosition === 'above' && (
        <Animated.View 
          style={[
            styles.suggestionsContainer,
            styles.suggestionsAbove,
            { backgroundColor: colors.surface },
            animatedSuggestionsStyle,
          ]}
        >
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item) => item.id.toString()}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>
      )}

      {/* Text Input */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChangeText}
        onSelectionChange={handleSelectionChange}
        style={[
          styles.input,
          { color: colors.textPrimary },
          textInputProps.style,
        ]}
        placeholderTextColor={colors.textSecondary}
        {...textInputProps}
      />

      {/* Suggestions (below input) */}
      {suggestionsPosition === 'below' && (
        <Animated.View 
          style={[
            styles.suggestionsContainer,
            styles.suggestionsBelow,
            { backgroundColor: colors.surface },
            animatedSuggestionsStyle,
          ]}
        >
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item) => item.id.toString()}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>
      )}
    </View>
  );
}

// Individual suggestion item
interface MentionSuggestionItemProps {
  user: UserSuggestion;
  onPress: () => void;
  colors: any;
}

const MentionSuggestionItem = memo(function MentionSuggestionItem({
  user,
  onPress,
  colors,
}: MentionSuggestionItemProps) {
  return (
    <TouchableOpacity
      style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
    >
      {user.avatar_url ? (
        <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
          <ThemedText style={[styles.avatarText, { color: colors.primary }]}>
            {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </ThemedText>
        </View>
      )}
      <View style={styles.userInfo}>
        <ThemedText style={[styles.userName, { color: colors.textPrimary }]}>
          {user.full_name}
        </ThemedText>
        {user.specialty && (
          <ThemedText style={[styles.userSpecialty, { color: colors.textSecondary }]}>
            {user.specialty}
          </ThemedText>
        )}
      </View>
    </TouchableOpacity>
  );
});

// Utility to parse mentions in text
export function parseMentions(text: string): { type: 'text' | 'mention'; content: string }[] {
  const parts: { type: 'text' | 'mention'; content: string }[] = [];
  const mentionRegex = /@(\w+)/g;
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    // Add mention
    parts.push({ type: 'mention', content: match[1] });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(lastIndex) });
  }

  return parts;
}

// Render text with highlighted mentions
interface RichMentionTextProps {
  text: string;
  onMentionPress?: (username: string) => void;
  style?: any;
  mentionStyle?: any;
}

export function RichMentionText({
  text,
  onMentionPress,
  style,
  mentionStyle,
}: RichMentionTextProps) {
  const { colors } = useThemeContext();
  const parts = parseMentions(text);

  return (
    <ThemedText style={style}>
      {parts.map((part, index) => {
        if (part.type === 'mention') {
          return (
            <ThemedText
              key={index}
              style={[
                { color: colors.primary, fontWeight: '600' },
                mentionStyle,
              ]}
              onPress={() => onMentionPress?.(part.content)}
            >
              @{part.content}
            </ThemedText>
          );
        }
        return <ThemedText key={index}>{part.content}</ThemedText>;
      })}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  input: {
    ...Typography.body,
    minHeight: 100,
    textAlignVertical: 'top',
    padding: Spacing.md,
  },
  suggestionsContainer: {
    overflow: 'hidden',
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  suggestionsAbove: {
    marginBottom: Spacing.sm,
  },
  suggestionsBelow: {
    marginTop: Spacing.sm,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: Spacing.md,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.small,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...Typography.body,
    fontWeight: '600',
  },
  userSpecialty: {
    ...Typography.small,
    marginTop: 2,
  },
});
