import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

import { colors, typography, spacing } from '@/theme';

// ============================================
// Network Context
// ============================================

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  isWifi: boolean;
  isCellular: boolean;
}

interface NetworkContextValue extends NetworkState {
  refresh: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextValue | null>(null);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: true,
    type: null,
    isWifi: false,
    isCellular: false,
  });

  const updateNetworkState = useCallback((state: NetInfoState) => {
    setNetworkState({
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      isWifi: state.type === 'wifi',
      isCellular: state.type === 'cellular',
    });
  }, []);

  const refresh = useCallback(async () => {
    const state = await NetInfo.fetch();
    updateNetworkState(state);
  }, [updateNetworkState]);

  useEffect(() => {
    // Get initial state
    NetInfo.fetch().then(updateNetworkState);

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener(updateNetworkState);

    return () => {
      unsubscribe();
    };
  }, [updateNetworkState]);

  const value: NetworkContextValue = {
    ...networkState,
    refresh,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
      <OfflineBanner />
    </NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextValue {
  const context = useContext(NetworkContext);
  
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  
  return context;
}

// Simple hook for just checking connection
export function useIsOnline(): boolean {
  const { isConnected, isInternetReachable } = useNetwork();
  return isConnected && isInternetReachable !== false;
}

// ============================================
// Offline Banner Component
// ============================================

function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const { isConnected, isInternetReachable, refresh } = useNetwork();
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  
  const isOffline = !isConnected || isInternetReachable === false;
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isOffline) {
      setWasOffline(true);
      translateY.value = withSpring(0, { damping: 15 });
      opacity.value = withTiming(1, { duration: 200 });
    } else if (wasOffline) {
      // Show "Back online" message briefly
      setShowReconnected(true);
      
      setTimeout(() => {
        translateY.value = withTiming(-100, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        
        setTimeout(() => {
          setShowReconnected(false);
          setWasOffline(false);
        }, 300);
      }, 2000);
    } else {
      translateY.value = -100;
      opacity.value = 0;
    }
  }, [isOffline, wasOffline, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!isOffline && !showReconnected) {
    return null;
  }

  const isReconnecting = showReconnected && !isOffline;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          paddingTop: insets.top + spacing.sm,
          backgroundColor: isReconnecting
            ? colors.semantic.success
            : colors.semantic.error,
        },
        animatedStyle,
      ]}
    >
      <Feather
        name={isReconnecting ? 'wifi' : 'wifi-off'}
        size={18}
        color={colors.text.inverse}
        style={styles.bannerIcon}
      />
      <Text style={styles.bannerText}>
        {isReconnecting ? 'Back online' : 'No internet connection'}
      </Text>
      {!isReconnecting && (
        <Pressable onPress={refresh} style={styles.retryButton} hitSlop={8}>
          <Feather name="refresh-cw" size={16} color={colors.text.inverse} />
        </Pressable>
      )}
    </Animated.View>
  );
}

// ============================================
// Offline-aware wrapper component
// ============================================

interface OfflineAwareProps {
  children: React.ReactNode;
  /** Content to show when offline */
  offlineContent?: React.ReactNode;
  /** Show offline content inline vs overlay */
  inline?: boolean;
}

export function OfflineAware({
  children,
  offlineContent,
  inline = false,
}: OfflineAwareProps) {
  const isOnline = useIsOnline();

  if (!isOnline && offlineContent) {
    return <>{offlineContent}</>;
  }

  if (!isOnline && !inline) {
    return (
      <View style={styles.offlineContainer}>
        {children}
        <View style={styles.offlineOverlay}>
          <Feather name="cloud-off" size={48} color={colors.text.tertiary} />
          <Text style={styles.offlineTitle}>You're offline</Text>
          <Text style={styles.offlineMessage}>
            This content requires an internet connection.
          </Text>
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    zIndex: 9999,
  },
  bannerIcon: {
    marginRight: spacing.sm,
  },
  bannerText: {
    ...typography.captionMedium,
    color: colors.text.inverse,
  },
  retryButton: {
    marginLeft: spacing.md,
    padding: spacing.xs,
  },

  // Offline aware
  offlineContainer: {
    flex: 1,
    position: 'relative',
  },
  offlineOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  offlineTitle: {
    ...typography.heading,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  offlineMessage: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default NetworkProvider;
