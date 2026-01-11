import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { reloadAppAsync } from 'expo';

import { colors, typography, spacing, layout } from '@/theme';
import { Button } from '@/components';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Fallback component to render on error */
  fallback?: ReactNode;
  /** Called when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Show detailed error info (dev only) */
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showErrorDetails: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showErrorDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call optional error handler (for analytics/reporting)
    this.props.onError?.(error, errorInfo);

    // TODO: Send to error reporting service (Sentry, Bugsnag, etc.)
    // errorReportingService.captureException(error, { extra: errorInfo });
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showErrorDetails: false,
    });
  };

  handleReload = async (): Promise<void> => {
    try {
      await reloadAppAsync();
    } catch {
      // Fallback if reloadAppAsync fails
      this.handleRetry();
    }
  };

  toggleErrorDetails = (): void => {
    this.setState((prev) => ({ showErrorDetails: !prev.showErrorDetails }));
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, showErrorDetails } = this.state;
    const { children, fallback, showDetails = __DEV__ } = this.props;

    if (hasError) {
      // Custom fallback provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Feather name="alert-triangle" size={64} color={colors.semantic.error} />
            </View>

            {/* Title & Message */}
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.message}>
              We're sorry, but something unexpected happened. Please try again or restart the app.
            </Text>

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                variant="primary"
                onPress={this.handleRetry}
                fullWidth
                leftIcon="refresh-cw"
              >
                Try Again
              </Button>

              <Button
                variant="outline"
                onPress={this.handleReload}
                fullWidth
                leftIcon="power"
                style={styles.reloadButton}
              >
                Restart App
              </Button>
            </View>

            {/* Error Details (Dev only) */}
            {showDetails && error && (
              <View style={styles.detailsContainer}>
                <Pressable
                  onPress={this.toggleErrorDetails}
                  style={styles.detailsToggle}
                >
                  <Text style={styles.detailsToggleText}>
                    {showErrorDetails ? 'Hide' : 'Show'} Error Details
                  </Text>
                  <Feather
                    name={showErrorDetails ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.text.tertiary}
                  />
                </Pressable>

                {showErrorDetails && (
                  <ScrollView style={styles.errorDetails}>
                    <Text style={styles.errorName}>{error.name}</Text>
                    <Text style={styles.errorMessage}>{error.message}</Text>
                    {errorInfo?.componentStack && (
                      <Text style={styles.errorStack}>
                        {errorInfo.componentStack}
                      </Text>
                    )}
                  </ScrollView>
                )}
              </View>
            )}
          </View>
        </View>
      );
    }

    return children;
  }
}

// Screen-level error boundary with simpler UI
interface ScreenErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => void;
}

interface ScreenErrorBoundaryState {
  hasError: boolean;
}

export class ScreenErrorBoundary extends Component<
  ScreenErrorBoundaryProps,
  ScreenErrorBoundaryState
> {
  constructor(props: ScreenErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): Partial<ScreenErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ScreenErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false });
    this.props.onRetry?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.screenErrorContainer}>
          <Feather name="alert-circle" size={48} color={colors.text.tertiary} />
          <Text style={styles.screenErrorTitle}>Unable to load</Text>
          <Text style={styles.screenErrorMessage}>
            Something went wrong loading this screen.
          </Text>
          <Button
            variant="outline"
            size="sm"
            onPress={this.handleRetry}
            leftIcon="refresh-cw"
          >
            Try Again
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  actions: {
    width: '100%',
  },
  reloadButton: {
    marginTop: spacing.sm,
  },
  detailsContainer: {
    width: '100%',
    marginTop: spacing.xl,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  detailsToggleText: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginRight: spacing.xs,
  },
  errorDetails: {
    maxHeight: 200,
    backgroundColor: colors.background.secondary,
    borderRadius: layout.radiusMedium,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  errorName: {
    ...typography.captionMedium,
    color: colors.semantic.error,
    marginBottom: spacing.xs,
  },
  errorMessage: {
    ...typography.caption,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  errorStack: {
    ...typography.small,
    color: colors.text.tertiary,
    fontFamily: 'monospace',
  },

  // Screen Error
  screenErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  screenErrorTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  screenErrorMessage: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});

export default ErrorBoundary;
