/**
 * Onboarding Tooltips
 * Guide new users through app features
 */

import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useThemeContext } from '@/contexts/ThemeContext';
import { haptics } from '@/lib/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Tooltip positions
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'center';

// Tooltip definition
export interface TooltipStep {
  id: string;
  title: string;
  description: string;
  targetRef?: React.RefObject<View>;
  position?: TooltipPosition;
  icon?: string;
  highlightPadding?: number;
}

// Tour definition
export interface OnboardingTour {
  id: string;
  steps: TooltipStep[];
  showOnce?: boolean;
  delay?: number;
}

// Predefined tours
export const TOURS = {
  HOME_FEED: {
    id: 'home_feed_tour',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to MedInvest! 👋',
        description: 'Let\'s take a quick tour of the app to help you get started.',
        position: 'center' as TooltipPosition,
        icon: 'sparkles',
      },
      {
        id: 'feed',
        title: 'Your Feed',
        description: 'See posts from people you follow and trending discussions in your specialty rooms.',
        position: 'bottom' as TooltipPosition,
        icon: 'home-outline',
      },
      {
        id: 'rooms',
        title: 'Specialty Rooms',
        description: 'Filter your feed by specialty. Tap here to see posts from specific medical communities.',
        position: 'bottom' as TooltipPosition,
        icon: 'grid-outline',
      },
      {
        id: 'create',
        title: 'Share Your Insights',
        description: 'Tap the + button to create a post, share cases, or ask questions.',
        position: 'top' as TooltipPosition,
        icon: 'add-circle-outline',
      },
    ],
    showOnce: true,
  },
  
  POST_CREATION: {
    id: 'post_creation_tour',
    steps: [
      {
        id: 'content',
        title: 'Write Your Post',
        description: 'Share your thoughts, cases, or questions with the community.',
        position: 'bottom' as TooltipPosition,
        icon: 'create-outline',
      },
      {
        id: 'media',
        title: 'Add Media',
        description: 'Attach images or videos to illustrate your point.',
        position: 'top' as TooltipPosition,
        icon: 'images-outline',
      },
      {
        id: 'room',
        title: 'Choose a Room',
        description: 'Select a specialty room to reach the right audience.',
        position: 'top' as TooltipPosition,
        icon: 'medical-outline',
      },
      {
        id: 'anonymous',
        title: 'Post Anonymously',
        description: 'Toggle this to share sensitive topics without revealing your identity.',
        position: 'top' as TooltipPosition,
        icon: 'eye-off-outline',
      },
    ],
    showOnce: true,
  },
  
  PROFILE: {
    id: 'profile_tour',
    steps: [
      {
        id: 'stats',
        title: 'Your Profile',
        description: 'See your posts, followers, and achievements all in one place.',
        position: 'bottom' as TooltipPosition,
        icon: 'person-outline',
      },
      {
        id: 'edit',
        title: 'Complete Your Profile',
        description: 'Add your specialty, credentials, and bio to build trust with the community.',
        position: 'bottom' as TooltipPosition,
        icon: 'pencil-outline',
      },
    ],
    showOnce: true,
  },
  
  DEALS: {
    id: 'deals_tour',
    steps: [
      {
        id: 'browse',
        title: 'Investment Opportunities',
        description: 'Browse vetted healthcare investment opportunities exclusive to medical professionals.',
        position: 'bottom' as TooltipPosition,
        icon: 'trending-up-outline',
      },
      {
        id: 'filters',
        title: 'Filter Deals',
        description: 'Filter by stage, sector, and minimum investment to find opportunities that match your criteria.',
        position: 'bottom' as TooltipPosition,
        icon: 'options-outline',
      },
    ],
    showOnce: true,
  },
};

// Storage key for completed tours
const COMPLETED_TOURS_KEY = 'completed_onboarding_tours';

// =============================================================================
// TOOLTIP OVERLAY
// =============================================================================

interface TooltipOverlayProps {
  visible: boolean;
  step: TooltipStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

export const TooltipOverlay = memo(function TooltipOverlay({
  visible,
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  onComplete,
}: TooltipOverlayProps) {
  const { colors } = useThemeContext();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible, step.id]);

  if (!visible) return null;

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const isCentered = step.position === 'center';

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Background */}
        <TouchableOpacity
          style={styles.overlayBackground}
          activeOpacity={1}
          onPress={onSkip}
        />

        {/* Tooltip card */}
        <Animated.View
          style={[
            styles.tooltipCard,
            {
              backgroundColor: colors.surface,
              transform: [{ scale: scaleAnim }],
            },
            isCentered && styles.centeredCard,
          ]}
        >
          {/* Icon */}
          {step.icon && (
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name={step.icon as any} size={32} color={colors.primary} />
            </View>
          )}

          {/* Content */}
          <ThemedText style={[styles.tooltipTitle, { color: colors.textPrimary }]}>
            {step.title}
          </ThemedText>
          <ThemedText style={[styles.tooltipDescription, { color: colors.textSecondary }]}>
            {step.description}
          </ThemedText>

          {/* Progress dots */}
          <View style={styles.progressDots}>
            {Array.from({ length: totalSteps }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index === currentStep ? colors.primary : colors.border,
                  },
                ]}
              />
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {!isFirstStep && (
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton, { borderColor: colors.border }]}
                onPress={() => {
                  haptics.buttonPress();
                  onPrev();
                }}
              >
                <ThemedText style={[styles.actionButtonText, { color: colors.textPrimary }]}>
                  Back
                </ThemedText>
              </TouchableOpacity>
            )}
            
            {isFirstStep && (
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton, { borderColor: colors.border }]}
                onPress={() => {
                  haptics.buttonPress();
                  onSkip();
                }}
              >
                <ThemedText style={[styles.actionButtonText, { color: colors.textSecondary }]}>
                  Skip
                </ThemedText>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                haptics.buttonPress();
                if (isLastStep) {
                  onComplete();
                } else {
                  onNext();
                }
              }}
            >
              <ThemedText style={styles.primaryButtonText}>
                {isLastStep ? 'Get Started' : 'Next'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
});

// =============================================================================
// SPOTLIGHT HIGHLIGHT
// =============================================================================

interface SpotlightHighlightProps {
  visible: boolean;
  targetLayout?: { x: number; y: number; width: number; height: number };
  padding?: number;
}

export const SpotlightHighlight = memo(function SpotlightHighlight({
  visible,
  targetLayout,
  padding = 8,
}: SpotlightHighlightProps) {
  if (!visible || !targetLayout) return null;

  const { x, y, width, height } = targetLayout;

  return (
    <View style={styles.spotlightContainer} pointerEvents="none">
      {/* Top overlay */}
      <View style={[styles.spotlightOverlay, { height: y - padding }]} />
      
      {/* Middle row */}
      <View style={[styles.spotlightRow, { height: height + padding * 2 }]}>
        {/* Left overlay */}
        <View style={[styles.spotlightOverlay, { width: x - padding }]} />
        
        {/* Spotlight hole */}
        <View
          style={[
            styles.spotlightHole,
            {
              width: width + padding * 2,
              height: height + padding * 2,
              borderRadius: BorderRadius.md,
            },
          ]}
        />
        
        {/* Right overlay */}
        <View style={[styles.spotlightOverlay, { flex: 1 }]} />
      </View>
      
      {/* Bottom overlay */}
      <View style={[styles.spotlightOverlay, { flex: 1 }]} />
    </View>
  );
});

// =============================================================================
// ONBOARDING SERVICE
// =============================================================================

class OnboardingService {
  private completedTours: Set<string> = new Set();
  private loaded = false;

  async load(): Promise<void> {
    if (this.loaded) return;

    try {
      const stored = await AsyncStorage.getItem(COMPLETED_TOURS_KEY);
      if (stored) {
        const completed = JSON.parse(stored) as string[];
        this.completedTours = new Set(completed);
      }
      this.loaded = true;
    } catch (error) {
      console.error('[Onboarding] Error loading:', error);
    }
  }

  async markTourComplete(tourId: string): Promise<void> {
    this.completedTours.add(tourId);
    await this.persist();
  }

  async isTourCompleted(tourId: string): Promise<boolean> {
    await this.load();
    return this.completedTours.has(tourId);
  }

  async shouldShowTour(tour: OnboardingTour): Promise<boolean> {
    if (!tour.showOnce) return true;
    return !(await this.isTourCompleted(tour.id));
  }

  async resetTour(tourId: string): Promise<void> {
    this.completedTours.delete(tourId);
    await this.persist();
  }

  async resetAllTours(): Promise<void> {
    this.completedTours.clear();
    await AsyncStorage.removeItem(COMPLETED_TOURS_KEY);
  }

  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        COMPLETED_TOURS_KEY,
        JSON.stringify(Array.from(this.completedTours))
      );
    } catch (error) {
      console.error('[Onboarding] Error saving:', error);
    }
  }
}

export const onboardingService = new OnboardingService();

// =============================================================================
// HOOK
// =============================================================================

export function useOnboardingTour(tour: OnboardingTour) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    checkAndStart();
  }, []);

  const checkAndStart = async () => {
    const shouldShow = await onboardingService.shouldShowTour(tour);
    if (shouldShow) {
      // Delay start slightly
      setTimeout(() => {
        setIsActive(true);
      }, tour.delay || 500);
    }
  };

  const startTour = useCallback(() => {
    setCurrentStepIndex(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < tour.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [currentStepIndex, tour.steps.length]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const skipTour = useCallback(async () => {
    setIsActive(false);
    if (tour.showOnce) {
      await onboardingService.markTourComplete(tour.id);
    }
  }, [tour]);

  const completeTour = useCallback(async () => {
    setIsActive(false);
    haptics.success();
    await onboardingService.markTourComplete(tour.id);
  }, [tour]);

  const currentStep = tour.steps[currentStepIndex];

  return {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps: tour.steps.length,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
  };
}

// =============================================================================
// FEATURE HIGHLIGHT COMPONENT
// =============================================================================

interface FeatureHighlightProps {
  children: React.ReactNode;
  featureId: string;
  title: string;
  description: string;
  position?: TooltipPosition;
  showOnce?: boolean;
}

export const FeatureHighlight = memo(function FeatureHighlight({
  children,
  featureId,
  title,
  description,
  position = 'bottom',
  showOnce = true,
}: FeatureHighlightProps) {
  const { colors } = useThemeContext();
  const [showTooltip, setShowTooltip] = useState(false);
  const [layout, setLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const viewRef = useRef<View>(null);

  useEffect(() => {
    checkIfShouldShow();
  }, []);

  const checkIfShouldShow = async () => {
    if (showOnce) {
      const completed = await onboardingService.isTourCompleted(`feature_${featureId}`);
      if (!completed) {
        setTimeout(() => {
          measureAndShow();
        }, 1000);
      }
    }
  };

  const measureAndShow = () => {
    viewRef.current?.measureInWindow((x, y, width, height) => {
      setLayout({ x, y, width, height });
      setShowTooltip(true);
    });
  };

  const dismiss = async () => {
    setShowTooltip(false);
    if (showOnce) {
      await onboardingService.markTourComplete(`feature_${featureId}`);
    }
  };

  return (
    <>
      <View ref={viewRef} collapsable={false}>
        {children}
      </View>
      
      {showTooltip && layout && (
        <Modal transparent visible={showTooltip} animationType="fade">
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={dismiss}>
            <SpotlightHighlight visible targetLayout={layout} />
            
            <View
              style={[
                styles.featureTooltip,
                { backgroundColor: colors.surface },
                position === 'bottom' && { top: layout.y + layout.height + 12 },
                position === 'top' && { bottom: SCREEN_HEIGHT - layout.y + 12 },
              ]}
            >
              <ThemedText style={[styles.featureTitle, { color: colors.textPrimary }]}>
                {title}
              </ThemedText>
              <ThemedText style={[styles.featureDescription, { color: colors.textSecondary }]}>
                {description}
              </ThemedText>
              <TouchableOpacity
                style={[styles.gotItButton, { backgroundColor: colors.primary }]}
                onPress={dismiss}
              >
                <ThemedText style={styles.gotItText}>Got it</ThemedText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  tooltipCard: {
    width: SCREEN_WIDTH - Spacing.xl * 2,
    maxWidth: 340,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.card,
  },
  centeredCard: {
    position: 'absolute',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  tooltipTitle: {
    ...Typography.title,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  tooltipDescription: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  progressDots: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  actionButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    minWidth: 100,
    alignItems: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
  },
  primaryButton: {},
  actionButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
  primaryButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: 'white',
  },
  spotlightContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  spotlightOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  spotlightRow: {
    flexDirection: 'row',
  },
  spotlightHole: {
    backgroundColor: 'transparent',
  },
  featureTooltip: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  featureTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  featureDescription: {
    ...Typography.small,
    lineHeight: 18,
  },
  gotItButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-end',
  },
  gotItText: {
    ...Typography.small,
    fontWeight: '600',
    color: 'white',
  },
});
