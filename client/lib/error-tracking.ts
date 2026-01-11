/**
 * Error Tracking Service
 * Sentry integration for error monitoring
 */

import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';

// Error severity levels
export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

// Error context
export interface ErrorContext {
  screen?: string;
  action?: string;
  userId?: number;
  extra?: Record<string, unknown>;
}

class ErrorTrackingService {
  private isInitialized: boolean = false;
  private userId: string | null = null;

  /**
   * Initialize Sentry
   */
  initialize(): void {
    if (this.isInitialized) return;

    const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
    
    if (!dsn) {
      console.warn('[ErrorTracking] Sentry DSN not configured');
      return;
    }

    Sentry.init({
      dsn,
      environment: __DEV__ ? 'development' : 'production',
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30000,
      enableNativeCrashHandling: true,
      attachStacktrace: true,
      
      // Performance monitoring
      tracesSampleRate: __DEV__ ? 1.0 : 0.2,
      
      // Release info
      release: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
      dist: process.env.EXPO_PUBLIC_BUILD_NUMBER || '1',
      
      // Filter events
      beforeSend: (event) => {
        // Don't send events in development
        if (__DEV__) {
          console.log('[ErrorTracking] Event captured (dev):', event);
          return null;
        }

        // Filter out known non-errors
        if (event.exception?.values?.[0]?.type === 'NetworkError') {
          // Log network errors but don't send to Sentry
          return null;
        }

        return event;
      },

      // Configure breadcrumbs
      beforeBreadcrumb: (breadcrumb) => {
        // Filter out noisy breadcrumbs
        if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
          return null;
        }
        return breadcrumb;
      },

      // Integrations
      integrations: [
        // Add custom integrations here
      ],
    });

    // Set default context
    Sentry.setContext('app', {
      platform: Platform.OS,
      platformVersion: Platform.Version,
    });

    this.isInitialized = true;
    console.log('[ErrorTracking] Sentry initialized');
  }

  /**
   * Identify user for error tracking
   */
  identifyUser(userId: number, email?: string, username?: string): void {
    this.userId = userId.toString();

    Sentry.setUser({
      id: userId.toString(),
      email,
      username,
    });
  }

  /**
   * Clear user identity
   */
  clearUser(): void {
    this.userId = null;
    Sentry.setUser(null);
  }

  /**
   * Capture an exception
   */
  captureException(error: Error, context?: ErrorContext): string {
    if (!this.isInitialized) {
      console.error('[ErrorTracking] Not initialized:', error);
      return '';
    }

    // Set scope context
    Sentry.withScope((scope) => {
      if (context?.screen) {
        scope.setTag('screen', context.screen);
      }
      if (context?.action) {
        scope.setTag('action', context.action);
      }
      if (context?.userId) {
        scope.setUser({ id: context.userId.toString() });
      }
      if (context?.extra) {
        scope.setExtras(context.extra);
      }

      Sentry.captureException(error);
    });

    return Sentry.lastEventId() || '';
  }

  /**
   * Capture a message
   */
  captureMessage(message: string, severity: ErrorSeverity = 'info', context?: ErrorContext): void {
    if (!this.isInitialized) {
      console.log('[ErrorTracking] Not initialized:', message);
      return;
    }

    Sentry.withScope((scope) => {
      scope.setLevel(severity);
      
      if (context?.screen) {
        scope.setTag('screen', context.screen);
      }
      if (context?.extra) {
        scope.setExtras(context.extra);
      }

      Sentry.captureMessage(message);
    });
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(
    message: string,
    category: string = 'custom',
    level: ErrorSeverity = 'info',
    data?: Record<string, unknown>
  ): void {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000,
    });
  }

  /**
   * Set tag for all future events
   */
  setTag(key: string, value: string): void {
    Sentry.setTag(key, value);
  }

  /**
   * Set extra context for all future events
   */
  setExtra(key: string, value: unknown): void {
    Sentry.setExtra(key, value);
  }

  /**
   * Set context for all future events
   */
  setContext(name: string, context: Record<string, unknown>): void {
    Sentry.setContext(name, context);
  }

  /**
   * Start a transaction for performance monitoring
   */
  startTransaction(name: string, operation: string): Sentry.Transaction | null {
    if (!this.isInitialized) return null;

    return Sentry.startTransaction({
      name,
      op: operation,
    });
  }

  /**
   * Wrap an async function with error tracking
   */
  async wrapAsync<T>(
    fn: () => Promise<T>,
    operationName: string,
    context?: ErrorContext
  ): Promise<T> {
    const transaction = this.startTransaction(operationName, 'task');
    
    try {
      const result = await fn();
      transaction?.setStatus('ok');
      return result;
    } catch (error) {
      transaction?.setStatus('internal_error');
      this.captureException(error as Error, context);
      throw error;
    } finally {
      transaction?.finish();
    }
  }

  /**
   * Create error boundary handler
   */
  createErrorBoundaryHandler(componentName: string) {
    return (error: Error, componentStack: string) => {
      this.captureException(error, {
        screen: componentName,
        extra: { componentStack },
      });
    };
  }

  /**
   * Flush pending events
   */
  async flush(timeout: number = 2000): Promise<boolean> {
    return Sentry.flush(timeout);
  }

  /**
   * Close Sentry
   */
  async close(timeout: number = 2000): Promise<void> {
    await Sentry.close(timeout);
    this.isInitialized = false;
  }
}

export const errorTracking = new ErrorTrackingService();

// Global error handler for unhandled errors
export function setupGlobalErrorHandler(): void {
  const defaultHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error, isFatal) => {
    errorTracking.captureException(error, {
      extra: { isFatal },
    });

    // Call default handler
    defaultHandler?.(error, isFatal);
  });

  // Handle unhandled promise rejections
  if (typeof global !== 'undefined') {
    const originalHandler = (global as any).onunhandledrejection;
    
    (global as any).onunhandledrejection = (event: PromiseRejectionEvent) => {
      errorTracking.captureException(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        { extra: { type: 'unhandled_promise_rejection' } }
      );
      
      originalHandler?.(event);
    };
  }
}

// React error boundary wrapper
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// HOC for wrapping screens with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return Sentry.withErrorBoundary(Component, {
    fallback: fallback as React.ReactElement,
    showDialog: false,
  });
}
