import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  FlatList,
  type ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors, typography, spacing, layout } from '@/theme';
import { Button } from '@/components';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ONBOARDING_COMPLETE_KEY = '@medinvest/onboarding_complete';

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  title: string;
  description: string;
  gradient: string[];
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    icon: 'trending-up',
    iconColor: colors.primary.main,
    title: 'Invest in Medical Innovation',
    description:
      'Discover vetted investment opportunities in biotech, medical devices, and digital health companies shaping the future of healthcare.',
    gradient: [colors.primary.main, colors.primary.dark],
  },
  {
    id: '2',
    icon: 'shield',
    iconColor: colors.secondary.main,
    title: 'Secure & Transparent',
    description:
      'Every investment is thoroughly vetted by our team of medical and financial experts. Track your portfolio in real-time with full transparency.',
    gradient: [colors.secondary.main, colors.secondary.dark],
  },
  {
    id: '3',
    icon: 'book-open',
    iconColor: '#8B5CF6',
    title: 'Stay Informed',
    description:
      'Access exclusive research, market insights, and expert analysis to make informed investment decisions in the medical sector.',
    gradient: ['#8B5CF6', '#6D28D9'],
  },
  {
    id: '4',
    icon: 'users',
    iconColor: '#F59E0B',
    title: 'Join Our Community',
    description:
      'Connect with like-minded investors passionate about advancing healthcare. Start your journey with as little as $1,000.',
    gradient: ['#F59E0B', '#D97706'],
  },
];

interface OnboardingScreenProps {
  navigation: any;
}

export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const isLastSlide = currentIndex === SLIDES.length - 1;

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index || 0);
      }
    },
    []
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const goToNext = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  }, [currentIndex]);

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      navigation.replace('Auth');
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
      navigation.replace('Auth');
    }
  }, [navigation]);

  const skipOnboarding = useCallback(async () => {
    await completeOnboarding();
  }, [completeOnboarding]);

  const renderSlide = useCallback(
    ({ item, index }: { item: OnboardingSlide; index: number }) => {
      return (
        <View style={styles.slide}>
          {/* Icon Container */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(600)}
            style={styles.iconWrapper}
          >
            <LinearGradient
              colors={item.gradient}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.iconInner}>
                <Feather name={item.icon} size={64} color={item.iconColor} />
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Text Content */}
          <Animated.View
            entering={FadeInUp.delay(400).duration(600)}
            style={styles.textContent}
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </Animated.View>
        </View>
      );
    },
    []
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {SLIDES.map((_, index) => {
        const isActive = index === currentIndex;
        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              isActive && styles.dotActive,
            ]}
          />
        );
      })}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Skip Button */}
      {!isLastSlide && (
        <Animated.View
          entering={FadeIn.delay(600)}
          style={styles.skipContainer}
        >
          <Pressable onPress={skipOnboarding} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScroll={(event) => {
          scrollX.value = event.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Bottom Section */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + spacing.lg }]}>
        {/* Dots */}
        {renderDots()}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {isLastSlide ? (
            <Button
              variant="gradient"
              size="lg"
              onPress={completeOnboarding}
              fullWidth
              rightIcon="arrow-right"
            >
              Get Started
            </Button>
          ) : (
            <View style={styles.navigationButtons}>
              <View style={styles.nextButtonWrapper}>
                <Button
                  variant="primary"
                  size="lg"
                  onPress={goToNext}
                  fullWidth
                  rightIcon="arrow-right"
                >
                  Continue
                </Button>
              </View>
            </View>
          )}
        </View>

        {/* Terms Notice */}
        <Text style={styles.termsText}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
}

// Helper to check if onboarding is complete
export async function isOnboardingComplete(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

// Helper to reset onboarding (for testing)
export async function resetOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
  } catch (error) {
    console.error('Failed to reset onboarding:', error);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  // Skip
  skipContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
    paddingTop: spacing.md,
    paddingRight: spacing.lg,
  },
  skipButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skipText: {
    ...typography.body,
    color: colors.text.secondary,
  },

  // Slide
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },

  // Icon
  iconWrapper: {
    marginBottom: spacing['3xl'],
  },
  iconGradient: {
    width: 160,
    height: 160,
    borderRadius: 80,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 78,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text
  textContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  title: {
    ...typography.largeTitle,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 320,
  },

  // Bottom Section
  bottomSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },

  // Dots
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border.medium,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary.main,
  },

  // Actions
  actionsContainer: {
    marginBottom: spacing.lg,
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextButtonWrapper: {
    flex: 1,
  },

  // Terms
  termsText: {
    ...typography.small,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: colors.primary.main,
    textDecorationLine: 'underline',
  },
});
