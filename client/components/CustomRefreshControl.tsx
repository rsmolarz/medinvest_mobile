/**
 * Custom Pull-to-Refresh Animation
 * Branded refresh animation with MedInvest styling
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  RefreshControl as RNRefreshControl,
  RefreshControlProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, G } from 'react-native-svg';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

interface CustomRefreshControlProps extends Omit<RefreshControlProps, 'colors' | 'tintColor'> {
  refreshing: boolean;
  onRefresh: () => void;
  pullProgress?: number;
}

export default function CustomRefreshControl({
  refreshing,
  onRefresh,
  ...props
}: CustomRefreshControlProps) {
  const appColors = useAppColors();
  return (
    <RNRefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={Colors.primary}
      colors={[Colors.primary, Colors.secondary]}
      progressBackgroundColor={appColors.surface}
      {...props}
    />
  );
}

interface LogoRefreshAnimationProps {
  progress: Animated.Value;
  isRefreshing: boolean;
}

export function LogoRefreshAnimation({ progress, isRefreshing }: LogoRefreshAnimationProps) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRefreshing) {
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();

      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => {
        spinAnimation.stop();
        pulseAnimation.stop();
      };
    } else {
      spinValue.setValue(0);
      pulseValue.setValue(1);
    }
  }, [isRefreshing]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
    extrapolate: 'clamp',
  });

  const opacity = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.logoContainer,
        {
          opacity,
          transform: [
            { scale: Animated.multiply(scale, pulseValue) },
            { rotate: isRefreshing ? spin : '0deg' },
          ],
        },
      ]}
    >
      <View style={styles.logoCircle}>
        <Ionicons name="medical" size={24} color="white" />
      </View>
    </Animated.View>
  );
}

interface PulseDotsProps {
  isActive: boolean;
  color?: string;
}

export function PulseDots({ isActive, color = Colors.primary }: PulseDotsProps) {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isActive) {
      const createDotAnimation = (dot: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0.3,
              duration: 300,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const animation = Animated.parallel([
        createDotAnimation(dot1, 0),
        createDotAnimation(dot2, 150),
        createDotAnimation(dot3, 300),
      ]);

      animation.start();
      return () => animation.stop();
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, { backgroundColor: color, opacity: dot1 }]} />
      <Animated.View style={[styles.dot, { backgroundColor: color, opacity: dot2 }]} />
      <Animated.View style={[styles.dot, { backgroundColor: color, opacity: dot3 }]} />
    </View>
  );
}

interface HeartbeatAnimationProps {
  isActive: boolean;
}

export function HeartbeatAnimation({ isActive }: HeartbeatAnimationProps) {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      const animation = Animated.loop(
        Animated.timing(translateX, {
          toValue: -100,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animation.start();
      return () => animation.stop();
    } else {
      translateX.setValue(0);
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <View style={styles.heartbeatContainer}>
      <Animated.View style={[styles.heartbeatLine, { transform: [{ translateX }] }]}>
        <Svg width={200} height={40} viewBox="0 0 200 40">
          <Path
            d="M0,20 L30,20 L35,20 L40,5 L45,35 L50,10 L55,30 L60,20 L65,20 L200,20"
            stroke={Colors.primary}
            strokeWidth={2}
            fill="none"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export function CircularProgress({
  progress,
  size = 40,
  strokeWidth = 3,
  color = Colors.primary,
}: CircularProgressProps) {
  const appColors = useAppColors();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={appColors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {/* Center icon */}
      <View style={styles.circularProgressIcon}>
        <Ionicons name="arrow-down" size={16} color={color} />
      </View>
    </View>
  );
}

interface RefreshHeaderProps {
  progress: number;
  isRefreshing: boolean;
  pullText?: string;
  releaseText?: string;
  refreshingText?: string;
}

export function RefreshHeader({
  progress,
  isRefreshing,
  pullText = 'Pull to refresh',
  releaseText = 'Release to refresh',
  refreshingText = 'Refreshing...',
}: RefreshHeaderProps) {
  const appColors = useAppColors();

  const getText = () => {
    if (isRefreshing) return refreshingText;
    if (progress >= 1) return releaseText;
    return pullText;
  };

  return (
    <View style={[styles.refreshHeader, { backgroundColor: appColors.background }]}>
      <View style={styles.refreshContent}>
        {isRefreshing ? (
          <PulseDots isActive={true} />
        ) : (
          <CircularProgress progress={Math.min(progress, 1)} />
        )}
        <ThemedText style={[styles.refreshText, { color: appColors.textSecondary }]}>{getText()}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  heartbeatContainer: {
    width: 100,
    height: 40,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartbeatLine: {
    position: 'absolute',
  },

  circularProgressIcon: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },

  refreshHeader: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  refreshText: {
    ...Typography.caption,
  },
});
