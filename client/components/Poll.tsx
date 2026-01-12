/**
 * Polls Component
 * Create and vote on polls in posts
 */

import React, { useState, useCallback, memo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useThemeContext } from '@/contexts/ThemeContext';
import { haptics } from '@/lib/haptics';
import { postsApi } from '@/lib/api';

// Types
export interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage?: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  endsAt?: string;
  hasVoted: boolean;
  userVote?: string; // option id
  allowMultiple: boolean;
  isAnonymous: boolean;
}

interface PollDisplayProps {
  poll: Poll;
  postId: number;
  onVote?: (optionId: string) => void;
}

interface PollCreatorProps {
  onPollChange: (poll: Partial<Poll> | null) => void;
  initialPoll?: Partial<Poll>;
}

// =============================================================================
// POLL DISPLAY (Voting UI)
// =============================================================================

export const PollDisplay = memo(function PollDisplay({
  poll,
  postId,
  onVote,
}: PollDisplayProps) {
  const { colors } = useThemeContext();
  const queryClient = useQueryClient();
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(
    poll.userVote ? new Set([poll.userVote]) : new Set()
  );
  const [hasVoted, setHasVoted] = useState(poll.hasVoted);
  const [animatedWidths] = useState(() => 
    poll.options.map(() => new Animated.Value(0))
  );

  // Check if poll has ended
  const isPollEnded = poll.endsAt ? new Date(poll.endsAt) < new Date() : false;
  const showResults = hasVoted || isPollEnded;

  // Animate results
  useEffect(() => {
    if (showResults) {
      poll.options.forEach((option, index) => {
        Animated.timing(animatedWidths[index], {
          toValue: option.percentage || 0,
          duration: 500,
          useNativeDriver: false,
        }).start();
      });
    }
  }, [showResults, poll.options]);

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async (optionIds: string[]) => {
      return postsApi.votePoll(postId, poll.id, optionIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      haptics.success();
    },
    onError: () => {
      haptics.error();
      Alert.alert('Error', 'Failed to submit vote. Please try again.');
    },
  });

  const handleOptionPress = useCallback((optionId: string) => {
    if (hasVoted || isPollEnded) return;

    haptics.selection();

    if (poll.allowMultiple) {
      setSelectedOptions(prev => {
        const next = new Set(prev);
        if (next.has(optionId)) {
          next.delete(optionId);
        } else {
          next.add(optionId);
        }
        return next;
      });
    } else {
      setSelectedOptions(new Set([optionId]));
    }
  }, [hasVoted, isPollEnded, poll.allowMultiple]);

  const handleVote = useCallback(() => {
    if (selectedOptions.size === 0) {
      Alert.alert('Select an option', 'Please select at least one option to vote.');
      return;
    }

    haptics.buttonPress();
    setHasVoted(true);
    voteMutation.mutate(Array.from(selectedOptions));
    onVote?.(Array.from(selectedOptions)[0]);
  }, [selectedOptions, voteMutation, onVote]);

  const formatTimeRemaining = (endDate: string): string => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d left`;
    if (hours > 0) return `${hours}h left`;
    
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}m left`;
  };

  return (
    <View style={[styles.pollContainer, { backgroundColor: colors.backgroundSecondary }]}>
      {/* Question */}
      <ThemedText style={[styles.pollQuestion, { color: colors.textPrimary }]}>
        {poll.question}
      </ThemedText>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {poll.options.map((option, index) => {
          const isSelected = selectedOptions.has(option.id);
          const isWinner = showResults && option.percentage === Math.max(...poll.options.map(o => o.percentage || 0));

          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              onPress={() => handleOptionPress(option.id)}
              disabled={hasVoted || isPollEnded}
              activeOpacity={0.7}
            >
              {/* Progress bar (shown after voting) */}
              {showResults && (
                <Animated.View
                  style={[
                    styles.progressBar,
                    {
                      backgroundColor: isWinner ? colors.primary + '30' : colors.backgroundSecondary,
                      width: animatedWidths[index].interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              )}

              {/* Option content */}
              <View style={styles.optionContent}>
                {/* Selection indicator */}
                {!showResults && (
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: isSelected ? colors.primary : colors.textSecondary,
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                      },
                      poll.allowMultiple ? styles.checkboxSquare : styles.checkboxRound,
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={12} color="white" />
                    )}
                  </View>
                )}

                {/* User's vote indicator */}
                {showResults && poll.userVote === option.id && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.primary}
                    style={styles.votedIcon}
                  />
                )}

                <ThemedText
                  style={[
                    styles.optionText,
                    { color: colors.textPrimary },
                    isWinner && { fontWeight: '600' },
                  ]}
                >
                  {option.text}
                </ThemedText>

                {/* Percentage & votes */}
                {showResults && (
                  <ThemedText style={[styles.voteCount, { color: colors.textSecondary }]}>
                    {option.percentage?.toFixed(0)}% ({option.votes})
                  </ThemedText>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Vote button */}
      {!hasVoted && !isPollEnded && (
        <TouchableOpacity
          style={[
            styles.voteButton,
            {
              backgroundColor: selectedOptions.size > 0 ? colors.primary : colors.border,
            },
          ]}
          onPress={handleVote}
          disabled={selectedOptions.size === 0 || voteMutation.isPending}
        >
          <ThemedText
            style={[
              styles.voteButtonText,
              { color: selectedOptions.size > 0 ? 'white' : colors.textSecondary },
            ]}
          >
            {voteMutation.isPending ? 'Voting...' : 'Vote'}
          </ThemedText>
        </TouchableOpacity>
      )}

      {/* Meta info */}
      <View style={styles.pollMeta}>
        <ThemedText style={[styles.pollMetaText, { color: colors.textSecondary }]}>
          {poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}
        </ThemedText>
        {poll.endsAt && (
          <>
            <View style={[styles.metaDot, { backgroundColor: colors.textSecondary }]} />
            <ThemedText style={[styles.pollMetaText, { color: colors.textSecondary }]}>
              {formatTimeRemaining(poll.endsAt)}
            </ThemedText>
          </>
        )}
        {poll.isAnonymous && (
          <>
            <View style={[styles.metaDot, { backgroundColor: colors.textSecondary }]} />
            <Ionicons name="eye-off-outline" size={12} color={colors.textSecondary} />
            <ThemedText style={[styles.pollMetaText, { color: colors.textSecondary, marginLeft: 2 }]}>
              Anonymous
            </ThemedText>
          </>
        )}
      </View>
    </View>
  );
});

// =============================================================================
// POLL CREATOR (For CreatePostScreen)
// =============================================================================

export const PollCreator = memo(function PollCreator({
  onPollChange,
  initialPoll,
}: PollCreatorProps) {
  const { colors } = useThemeContext();
  const [question, setQuestion] = useState(initialPoll?.question || '');
  const [options, setOptions] = useState<string[]>(
    initialPoll?.options?.map(o => o.text) || ['', '']
  );
  const [allowMultiple, setAllowMultiple] = useState(initialPoll?.allowMultiple || false);
  const [isAnonymous, setIsAnonymous] = useState(initialPoll?.isAnonymous || false);
  const [duration, setDuration] = useState<'1day' | '3days' | '7days' | 'none'>('1day');

  // Update parent when poll changes
  useEffect(() => {
    const validOptions = options.filter(o => o.trim());
    if (question.trim() && validOptions.length >= 2) {
      onPollChange({
        question: question.trim(),
        options: validOptions.map((text, i) => ({
          id: `opt_${i}`,
          text: text.trim(),
          votes: 0,
        })),
        allowMultiple,
        isAnonymous,
        endsAt: duration !== 'none' ? getEndDate(duration) : undefined,
      });
    } else {
      onPollChange(null);
    }
  }, [question, options, allowMultiple, isAnonymous, duration]);

  const getEndDate = (dur: string): string => {
    const date = new Date();
    switch (dur) {
      case '1day':
        date.setDate(date.getDate() + 1);
        break;
      case '3days':
        date.setDate(date.getDate() + 3);
        break;
      case '7days':
        date.setDate(date.getDate() + 7);
        break;
    }
    return date.toISOString();
  };

  const handleAddOption = () => {
    if (options.length >= 6) {
      Alert.alert('Maximum Options', 'You can add up to 6 options.');
      return;
    }
    haptics.buttonPress();
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      Alert.alert('Minimum Options', 'A poll must have at least 2 options.');
      return;
    }
    haptics.buttonPress();
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <View style={[styles.creatorContainer, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={styles.creatorHeader}>
        <Ionicons name="stats-chart" size={20} color={colors.primary} />
        <ThemedText style={[styles.creatorTitle, { color: colors.textPrimary }]}>
          Create Poll
        </ThemedText>
        <TouchableOpacity onPress={() => onPollChange(null)}>
          <Ionicons name="close" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Question */}
      <TextInput
        style={[styles.questionInput, { color: colors.textPrimary, borderColor: colors.border }]}
        placeholder="Ask a question..."
        placeholderTextColor={colors.textSecondary}
        value={question}
        onChangeText={setQuestion}
        maxLength={150}
      />

      {/* Options */}
      <View style={styles.optionsList}>
        {options.map((option, index) => (
          <View key={index} style={styles.optionInputRow}>
            <TextInput
              style={[
                styles.optionInput,
                { color: colors.textPrimary, borderColor: colors.border },
              ]}
              placeholder={`Option ${index + 1}`}
              placeholderTextColor={colors.textSecondary}
              value={option}
              onChangeText={(value) => handleOptionChange(index, value)}
              maxLength={50}
            />
            {options.length > 2 && (
              <TouchableOpacity
                style={styles.removeOptionButton}
                onPress={() => handleRemoveOption(index)}
              >
                <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Add option */}
      {options.length < 6 && (
        <TouchableOpacity style={styles.addOptionButton} onPress={handleAddOption}>
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <ThemedText style={[styles.addOptionText, { color: colors.primary }]}>
            Add option
          </ThemedText>
        </TouchableOpacity>
      )}

      {/* Settings */}
      <View style={[styles.settingsSection, { borderTopColor: colors.border }]}>
        {/* Duration */}
        <View style={styles.settingRow}>
          <ThemedText style={[styles.settingLabel, { color: colors.textPrimary }]}>
            Duration
          </ThemedText>
          <View style={styles.durationOptions}>
            {[
              { value: '1day', label: '1d' },
              { value: '3days', label: '3d' },
              { value: '7days', label: '7d' },
              { value: 'none', label: '∞' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.durationButton,
                  {
                    backgroundColor: duration === opt.value ? colors.primary : colors.backgroundSecondary,
                  },
                ]}
                onPress={() => {
                  haptics.selection();
                  setDuration(opt.value as any);
                }}
              >
                <ThemedText
                  style={[
                    styles.durationText,
                    { color: duration === opt.value ? 'white' : colors.textSecondary },
                  ]}
                >
                  {opt.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Multiple selection */}
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => {
            haptics.toggle();
            setAllowMultiple(!allowMultiple);
          }}
        >
          <ThemedText style={[styles.settingLabel, { color: colors.textPrimary }]}>
            Allow multiple selections
          </ThemedText>
          <Ionicons
            name={allowMultiple ? 'checkbox' : 'square-outline'}
            size={22}
            color={allowMultiple ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Anonymous */}
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => {
            haptics.toggle();
            setIsAnonymous(!isAnonymous);
          }}
        >
          <ThemedText style={[styles.settingLabel, { color: colors.textPrimary }]}>
            Anonymous voting
          </ThemedText>
          <Ionicons
            name={isAnonymous ? 'checkbox' : 'square-outline'}
            size={22}
            color={isAnonymous ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  // Poll Display
  pollContainer: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  pollQuestion: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  optionsContainer: {
    gap: Spacing.sm,
  },
  optionButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    minHeight: 44,
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: BorderRadius.md,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginRight: Spacing.sm,
  },
  checkboxRound: {
    borderRadius: 10,
  },
  checkboxSquare: {
    borderRadius: 4,
  },
  votedIcon: {
    marginRight: Spacing.sm,
  },
  optionText: {
    ...Typography.body,
    flex: 1,
  },
  voteCount: {
    ...Typography.caption,
    marginLeft: Spacing.sm,
  },
  voteButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  voteButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
  pollMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  pollMetaText: {
    ...Typography.small,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: Spacing.sm,
  },

  // Poll Creator
  creatorContainer: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.card,
  },
  creatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  creatorTitle: {
    ...Typography.body,
    fontWeight: '600',
    flex: 1,
    marginLeft: Spacing.sm,
  },
  questionInput: {
    ...Typography.body,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  optionsList: {
    gap: Spacing.sm,
  },
  optionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionInput: {
    ...Typography.body,
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  removeOptionButton: {
    padding: Spacing.sm,
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  addOptionText: {
    ...Typography.body,
    fontWeight: '500',
  },
  settingsSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  settingLabel: {
    ...Typography.body,
  },
  durationOptions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  durationButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  durationText: {
    ...Typography.small,
    fontWeight: '600',
  },
});
