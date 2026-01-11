/**
 * RichTextContent Component
 * Renders text with clickable mentions and hashtags
 */

import React, { memo, useMemo } from 'react';
import { Text, StyleSheet, TextStyle, StyleProp } from 'react-native';
import { Colors, Typography } from '@/constants/theme';
import { Mention } from '@/types';

interface RichTextContentProps {
  content: string;
  mentions?: Mention[];
  hashtags?: string[];
  onHashtagPress?: (tag: string) => void;
  onMentionPress?: (userId: number) => void;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
}

interface TextSegment {
  type: 'text' | 'mention' | 'hashtag' | 'link';
  content: string;
  data?: {
    userId?: number;
    tag?: string;
    url?: string;
  };
}

function RichTextContent({
  content,
  mentions = [],
  hashtags = [],
  onHashtagPress,
  onMentionPress,
  numberOfLines,
  style,
}: RichTextContentProps) {
  const segments = useMemo(() => {
    const result: TextSegment[] = [];
    
    // Pattern to match @mentions, #hashtags, and URLs
    const pattern = /(@\w+|#\w+|https?:\/\/[^\s]+)/g;
    
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(content)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        result.push({
          type: 'text',
          content: content.slice(lastIndex, match.index),
        });
      }

      const matchedText = match[0];

      if (matchedText.startsWith('@')) {
        // It's a mention
        const username = matchedText.slice(1);
        const mentionData = mentions.find(m => m.username === username);
        result.push({
          type: 'mention',
          content: matchedText,
          data: { userId: mentionData?.user_id },
        });
      } else if (matchedText.startsWith('#')) {
        // It's a hashtag
        const tag = matchedText.slice(1);
        result.push({
          type: 'hashtag',
          content: matchedText,
          data: { tag },
        });
      } else if (matchedText.startsWith('http')) {
        // It's a URL
        result.push({
          type: 'link',
          content: matchedText,
          data: { url: matchedText },
        });
      }

      lastIndex = match.index + matchedText.length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      result.push({
        type: 'text',
        content: content.slice(lastIndex),
      });
    }

    return result;
  }, [content, mentions]);

  const handleMentionPress = (userId?: number) => {
    if (userId && onMentionPress) {
      onMentionPress(userId);
    }
  };

  const handleHashtagPress = (tag?: string) => {
    if (tag && onHashtagPress) {
      onHashtagPress(tag);
    }
  };

  return (
    <Text style={[styles.text, style]} numberOfLines={numberOfLines}>
      {segments.map((segment, index) => {
        switch (segment.type) {
          case 'mention':
            return (
              <Text
                key={index}
                style={styles.mention}
                onPress={() => handleMentionPress(segment.data?.userId)}
              >
                {segment.content}
              </Text>
            );
          case 'hashtag':
            return (
              <Text
                key={index}
                style={styles.hashtag}
                onPress={() => handleHashtagPress(segment.data?.tag)}
              >
                {segment.content}
              </Text>
            );
          case 'link':
            return (
              <Text key={index} style={styles.link}>
                {segment.content}
              </Text>
            );
          default:
            return <Text key={index}>{segment.content}</Text>;
        }
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  mention: {
    color: Colors.primary,
    fontWeight: '500',
  },
  hashtag: {
    color: Colors.primary,
    fontWeight: '500',
  },
  link: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
});

export default memo(RichTextContent);
