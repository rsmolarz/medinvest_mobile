import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  SlideInUp,
  SlideOutUp,
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { colors, typography, spacing, layout, shadows } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top' | 'bottom';

export interface ToastConfig {
  /** Toast message */
  message: string;
  /** Toast type */
  type?: ToastType;
  /** Title (optional) */
  title?: string;
  /** Duration in ms (0 for persistent) */
  duration?: number;
  /** Position on screen */
  position?: ToastPosition;
  /** Action button */
  action?: {
    label: string;
    onPress: () => void;
  };
  /** Called when toast is dismissed */
  onDismiss?: () => void;
}

interface ToastState extends ToastConfig {
  id: string;
}

interface ToastContextValue {
  show: (config: ToastConfig) => string;
  hide: (id: string) => void;
  hideAll: () => void;
  success: (message: string, options?: Partial<ToastConfig>) => string;
  error: (message: string, options?: Partial<ToastConfig>) => string;
  warning: (message: string, options?: Partial<ToastConfig>) => string;
  info: (message: string, options?: Partial<ToastConfig>) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_CONFIG: Record<
  ToastType,
  { icon: keyof typeof Feather.glyphMap; backgroundColor: string; iconColor: string }
> = {
  success: {
    icon: 'check-circle',
    backgroundColor: colors.semantic.success,
    iconColor: colors.text.inverse,
  },
  error: {
    icon: 'x-circle',
    backgroundColor: colors.semantic.error,
    iconColor: colors.text.inverse,
  },
  warning: {
    icon: 'alert-triangle',
    backgroundColor: colors.semantic.warning,
    iconColor: '#000000',
  },
  info: {
    icon: 'info',
    backgroundColor: '#3B82F6',
    iconColor: colors.text.inverse,
  },
};

const DEFAULT_DURATION = 4000;

// Individual Toast Component
interface ToastItemProps extends ToastState {
  onDismiss: (id: string) => void;
  position: ToastPosition;
}

function ToastItem({
  id,
  message,
  type = 'info',
  title,
  duration = DEFAULT_DURATION,
  action,
  onDismiss,
  position,
}: ToastItemProps) {
  const translateX = useSharedValue(0);
  const config = TOAST_CONFIG[type];
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Auto-dismiss timer
  useEffect(() => {
    if (duration > 0) {
      timeoutRef.current = setTimeout(() => {
        onDismiss(id);
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [id, duration, onDismiss]);

  // Swipe to dismiss gesture
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SCREEN_WIDTH * 0.3) {
        translateX.value = withTiming(
          event.translationX > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH,
          { duration: 200 },
          () => {
            runOnJS(onDismiss)(id);
          }
        );
      } else {
        translateX.value = withSpring(0, { damping: 15 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: 1 - Math.abs(translateX.value) / SCREEN_WIDTH,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        entering={position === 'top' ? SlideInUp.springify() : FadeIn}
        exiting={position === 'top' ? SlideOutUp : FadeOut}
        layout={Layout.springify()}
        style={[
          styles.toast,
          { backgroundColor: config.backgroundColor },
          animatedStyle,
        ]}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Feather name={config.icon} size={20} color={config.iconColor} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {title && (
            <Text
              style={[styles.title, { color: config.iconColor }]}
              numberOfLines={1}
            >
              {title}
            </Text>
          )}
          <Text
            style={[styles.message, { color: config.iconColor }]}
            numberOfLines={2}
          >
            {message}
          </Text>
        </View>

        {/* Action or Close Button */}
        {action ? (
          <Pressable
            style={styles.actionButton}
            onPress={() => {
              action.onPress();
              onDismiss(id);
            }}
          >
            <Text style={[styles.actionText, { color: config.iconColor }]}>
              {action.label}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.closeButton}
            onPress={() => onDismiss(id)}
            hitSlop={8}
          >
            <Feather name="x" size={18} color={config.iconColor} />
          </Pressable>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

// Toast Provider Component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const toastIdRef = useRef(0);

  const show = useCallback((config: ToastConfig): string => {
    const id = `toast-${++toastIdRef.current}`;
    const toast: ToastState = {
      id,
      type: 'info',
      duration: DEFAULT_DURATION,
      position: 'top',
      ...config,
    };

    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  const hide = useCallback((id: string) => {
    setToasts((prev) => {
      const toast = prev.find((t) => t.id === id);
      if (toast?.onDismiss) {
        toast.onDismiss();
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const hideAll = useCallback(() => {
    setToasts((prev) => {
      prev.forEach((toast) => toast.onDismiss?.());
      return [];
    });
  }, []);

  const success = useCallback(
    (message: string, options?: Partial<ToastConfig>) =>
      show({ message, type: 'success', ...options }),
    [show]
  );

  const error = useCallback(
    (message: string, options?: Partial<ToastConfig>) =>
      show({ message, type: 'error', ...options }),
    [show]
  );

  const warning = useCallback(
    (message: string, options?: Partial<ToastConfig>) =>
      show({ message, type: 'warning', ...options }),
    [show]
  );

  const info = useCallback(
    (message: string, options?: Partial<ToastConfig>) =>
      show({ message, type: 'info', ...options }),
    [show]
  );

  const contextValue: ToastContextValue = {
    show,
    hide,
    hideAll,
    success,
    error,
    warning,
    info,
  };

  // Separate toasts by position
  const topToasts = toasts.filter((t) => t.position === 'top');
  const bottomToasts = toasts.filter((t) => t.position === 'bottom');

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Top Toasts */}
      <View
        style={[
          styles.container,
          styles.topContainer,
          { top: insets.top + spacing.sm },
        ]}
        pointerEvents="box-none"
      >
        {topToasts.map((toast) => (
          <ToastItem
            key={toast.id}
            {...toast}
            position="top"
            onDismiss={hide}
          />
        ))}
      </View>

      {/* Bottom Toasts */}
      <View
        style={[
          styles.container,
          styles.bottomContainer,
          { bottom: insets.bottom + spacing.lg },
        ]}
        pointerEvents="box-none"
      >
        {bottomToasts.map((toast) => (
          <ToastItem
            key={toast.id}
            {...toast}
            position="bottom"
            onDismiss={hide}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

// Hook to use toast
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
  },
  topContainer: {
    alignItems: 'center',
  },
  bottomContainer: {
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: layout.radiusMedium,
    marginBottom: spacing.sm,
    ...shadows.elevated,
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    ...typography.captionMedium,
    marginBottom: spacing.xs / 2,
  },
  message: {
    ...typography.caption,
    lineHeight: 18,
  },
  actionButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  actionText: {
    ...typography.captionMedium,
    textDecorationLine: 'underline',
  },
  closeButton: {
    padding: spacing.xs,
  },
});

export default ToastProvider;
