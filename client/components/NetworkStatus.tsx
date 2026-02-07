/**
 * Network Status Provider
 * Monitors connectivity and shows offline banner
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useAppColors } from '@/hooks/useAppColors';

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
  retry: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isInternetReachable: true,
  connectionType: null,
  retry: async () => {},
});

export const useNetwork = () => useContext(NetworkContext);

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const appColors = useAppColors();
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const bannerAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected ?? false;
      const reachable = state.isInternetReachable;
      
      setIsConnected(connected);
      setIsInternetReachable(reachable);
      setConnectionType(state.type);

      if (!connected || reachable === false) {
        setShowBanner(true);
        Animated.spring(bannerAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }).start();
      } else if (showBanner) {
        Animated.timing(bannerAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowBanner(false));
      }
    });

    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable);
      setConnectionType(state.type);
    });

    return () => unsubscribe();
  }, []);

  const retry = useCallback(async () => {
    setIsRetrying(true);
    try {
      const state = await NetInfo.fetch();
      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable);
      
      if (state.isConnected && state.isInternetReachable !== false) {
        Animated.timing(bannerAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowBanner(false));
      }
    } finally {
      setIsRetrying(false);
    }
  }, [bannerAnim]);

  return (
    <NetworkContext.Provider value={{ isConnected, isInternetReachable, connectionType, retry }}>
      {children}
      
      {showBanner && (
        <Animated.View
          style={[
            styles.banner,
            { backgroundColor: appColors.error },
            {
              transform: [
                {
                  translateY: bannerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 0],
                  }),
                },
              ],
              opacity: bannerAnim,
            },
          ]}
        >
          <View style={styles.bannerContent}>
            <Ionicons name="cloud-offline-outline" size={20} color="white" />
            <ThemedText style={styles.bannerText}>
              {!isConnected 
                ? "You're offline" 
                : "Limited connectivity"}
            </ThemedText>
          </View>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={retry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <ThemedText style={styles.retryText}>Retry</ThemedText>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}
    </NetworkContext.Provider>
  );
}

interface OfflinePlaceholderProps {
  onRetry?: () => void;
  message?: string;
}

export function OfflinePlaceholder({ 
  onRetry, 
  message = "You're currently offline" 
}: OfflinePlaceholderProps) {
  const appColors = useAppColors();
  const { retry, isConnected } = useNetwork();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await retry();
      onRetry?.();
    } finally {
      setIsRetrying(false);
    }
  };

  if (isConnected) return null;

  return (
    <View style={styles.placeholder}>
      <View style={styles.placeholderIcon}>
        <Ionicons name="cloud-offline-outline" size={48} color={appColors.textSecondary} />
      </View>
      <ThemedText style={[styles.placeholderTitle, { color: appColors.textPrimary }]}>No Connection</ThemedText>
      <ThemedText style={[styles.placeholderMessage, { color: appColors.textSecondary }]}>{message}</ThemedText>
      <TouchableOpacity 
        style={styles.placeholderButton}
        onPress={handleRetry}
        disabled={isRetrying}
      >
        {isRetrying ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Ionicons name="refresh-outline" size={18} color="white" />
            <ThemedText style={styles.placeholderButtonText}>Try Again</ThemedText>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

interface ErrorStateProps {
  error: Error | string;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({ 
  error, 
  onRetry,
  title = 'Something went wrong'
}: ErrorStateProps) {
  const appColors = useAppColors();
  const [isRetrying, setIsRetrying] = useState(false);
  const errorMessage = typeof error === 'string' ? error : error.message;

  const handleRetry = async () => {
    if (!onRetry) return;
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <View style={styles.errorState}>
      <View style={[styles.errorIcon, { backgroundColor: appColors.error + '15' }]}>
        <Ionicons name="alert-circle-outline" size={48} color={appColors.error} />
      </View>
      <ThemedText style={[styles.errorTitle, { color: appColors.textPrimary }]}>{title}</ThemedText>
      <ThemedText style={[styles.errorMessage, { color: appColors.textSecondary }]}>{errorMessage}</ThemedText>
      {onRetry && (
        <TouchableOpacity 
          style={styles.errorButton}
          onPress={handleRetry}
          disabled={isRetrying}
        >
          {isRetrying ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={18} color="white" />
              <ThemedText style={styles.errorButtonText}>Try Again</ThemedText>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

interface RateLimitErrorProps {
  retryAfter?: number;
  onRetry?: () => void;
}

export function RateLimitError({ retryAfter, onRetry }: RateLimitErrorProps) {
  const appColors = useAppColors();
  const [countdown, setCountdown] = useState(retryAfter || 60);
  const [canRetry, setCanRetry] = useState(!retryAfter);

  useEffect(() => {
    if (!retryAfter || canRetry) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanRetry(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [retryAfter, canRetry]);

  return (
    <View style={styles.rateLimitContainer}>
      <View style={[styles.rateLimitIcon, { backgroundColor: appColors.warning + '15' }]}>
        <Ionicons name="time-outline" size={48} color={appColors.warning} />
      </View>
      <ThemedText style={[styles.rateLimitTitle, { color: appColors.textPrimary }]}>Slow Down</ThemedText>
      <ThemedText style={[styles.rateLimitMessage, { color: appColors.textSecondary }]}>
        You've made too many requests. Please wait a moment before trying again.
      </ThemedText>
      {!canRetry ? (
        <View style={styles.countdownContainer}>
          <ThemedText style={[styles.countdownText, { color: appColors.textSecondary }]}>
            Try again in {countdown}s
          </ThemedText>
        </View>
      ) : (
        <TouchableOpacity style={styles.rateLimitButton} onPress={onRetry}>
          <Ionicons name="refresh-outline" size={18} color="white" />
          <ThemedText style={styles.rateLimitButtonText}>Try Again</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    zIndex: 9999,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bannerText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
  retryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  retryText: {
    ...Typography.caption,
    color: 'white',
    fontWeight: '600',
  },

  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  placeholderIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  placeholderTitle: {
    ...Typography.heading,
    marginBottom: Spacing.sm,
  },
  placeholderMessage: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  placeholderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 24,
    gap: Spacing.sm,
  },
  placeholderButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },

  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  errorTitle: {
    ...Typography.heading,
    marginBottom: Spacing.sm,
  },
  errorMessage: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  errorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 24,
    gap: Spacing.sm,
  },
  errorButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },

  rateLimitContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  rateLimitIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  rateLimitTitle: {
    ...Typography.heading,
    marginBottom: Spacing.sm,
  },
  rateLimitMessage: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  countdownContainer: {
    backgroundColor: Colors.light.backgroundSecondary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 24,
  },
  countdownText: {
    ...Typography.body,
    fontWeight: '600',
  },
  rateLimitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 24,
    gap: Spacing.sm,
  },
  rateLimitButtonText: {
    ...Typography.body,
    color: 'white',
    fontWeight: '600',
  },
});
