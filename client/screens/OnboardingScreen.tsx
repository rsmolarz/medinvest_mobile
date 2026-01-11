/**
 * Onboarding Screen
 * First-time user welcome flow
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconType: 'ionicons' | 'material';
  gradient: string[];
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Welcome to MedInvest',
    description: 'The premier community for healthcare investors. Connect with experts, discover opportunities, and grow your portfolio.',
    icon: 'medical',
    iconType: 'ionicons',
    gradient: [Colors.primary, '#1565C0'],
  },
  {
    id: '2',
    title: 'Expert Community',
    description: 'Join 14 specialty rooms covering Biotech, MedTech, Pharma, Digital Health, and more. Learn from industry professionals.',
    icon: 'people',
    iconType: 'ionicons',
    gradient: ['#7C4DFF', '#651FFF'],
  },
  {
    id: '3',
    title: 'Investment Deals',
    description: 'Access exclusive healthcare investment opportunities. From early-stage startups to growth-stage companies.',
    icon: 'trending-up',
    iconType: 'ionicons',
    gradient: [Colors.secondary, '#00897B'],
  },
  {
    id: '4',
    title: 'AI-Powered Insights',
    description: 'Get instant answers about healthcare investments with our AI assistant. Due diligence made simple.',
    icon: 'robot',
    iconType: 'material',
    gradient: ['#FF6F00', '#FF8F00'],
  },
  {
    id: '5',
    title: 'Earn & Learn',
    description: 'Earn points for engaging, unlock achievements, and climb the leaderboard while expanding your investment knowledge.',
    icon: 'trophy',
    iconType: 'ionicons',
    gradient: ['#FFD600', '#FFAB00'],
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleComplete();
    }
  }, [currentIndex]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, []);

  const handleComplete = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
    
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  }, [navigation]);

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 1, 0.4],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slide}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale }], opacity }]}>
          <LinearGradient
            colors={item.gradient}
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {item.iconType === 'material' ? (
              <MaterialCommunityIcons name={item.icon as any} size={80} color="white" />
            ) : (
              <Ionicons name={item.icon as any} size={80} color="white" />
            )}
          </LinearGradient>
        </Animated.View>

        <Animated.View style={{ opacity }}>
          <ThemedText style={styles.title}>{item.title}</ThemedText>
          <ThemedText style={styles.description}>{item.description}</ThemedText>
        </Animated.View>
      </View>
    );
  };

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {SLIDES.map((_, index) => {
        const inputRange = [
          (index - 1) * SCREEN_WIDTH,
          index * SCREEN_WIDTH,
          (index + 1) * SCREEN_WIDTH,
        ];

        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: 'clamp',
        });

        const dotOpacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                width: dotWidth,
                opacity: dotOpacity,
              },
            ]}
          />
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <ThemedText style={styles.skipText}>Skip</ThemedText>
      </TouchableOpacity>

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
      />

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {renderDots()}

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButtonGradient}
          >
            <ThemedText style={styles.nextButtonText}>
              {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </ThemedText>
            <Ionicons
              name={currentIndex === SLIDES.length - 1 ? 'checkmark' : 'arrow-forward'}
              size={20}
              color="white"
            />
          </LinearGradient>
        </TouchableOpacity>

        {/* Sign In Link */}
        <TouchableOpacity style={styles.signInLink} onPress={handleComplete}>
          <ThemedText style={styles.signInText}>
            Already have an account? <ThemedText style={styles.signInTextBold}>Sign In</ThemedText>
          </ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/**
 * Check if onboarding has been completed
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
    return completed === 'true';
  } catch (error) {
    return false;
  }
}

/**
 * Reset onboarding status (for testing)
 */
export async function resetOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
  } catch (error) {
    console.error('Error resetting onboarding:', error);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: Spacing.lg,
    zIndex: 10,
    padding: Spacing.sm,
  },
  skipText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  slide: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: SCREEN_HEIGHT * 0.1,
  },
  iconContainer: {
    marginBottom: Spacing['3xl'],
  },
  iconGradient: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    ...Typography.largeTitle,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: Spacing.md,
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginHorizontal: 4,
  },
  nextButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  nextButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
  signInLink: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  signInText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  signInTextBold: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
