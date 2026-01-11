/**
 * API Error Handler
 * Centralized error handling with rate limiting support
 */

import { Alert } from 'react-native';

// Error types
export enum ApiErrorType {
  NETWORK = 'NETWORK',
  RATE_LIMIT = 'RATE_LIMIT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

export interface ApiErrorDetails {
  type: ApiErrorType;
  message: string;
  status?: number;
  retryAfter?: number; // seconds until retry allowed
  field?: string; // for validation errors
  originalError?: Error;
}

export class ApiError extends Error {
  type: ApiErrorType;
  status?: number;
  retryAfter?: number;
  field?: string;

  constructor(details: ApiErrorDetails) {
    super(details.message);
    this.name = 'ApiError';
    this.type = details.type;
    this.status = details.status;
    this.retryAfter = details.retryAfter;
    this.field = details.field;
  }

  /**
   * Check if error is due to rate limiting
   */
  isRateLimited(): boolean {
    return this.type === ApiErrorType.RATE_LIMIT;
  }

  /**
   * Check if error is due to network issues
   */
  isNetworkError(): boolean {
    return this.type === ApiErrorType.NETWORK;
  }

  /**
   * Check if error requires re-authentication
   */
  requiresAuth(): boolean {
    return this.type === ApiErrorType.UNAUTHORIZED;
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    switch (this.type) {
      case ApiErrorType.NETWORK:
        return 'Unable to connect. Please check your internet connection.';
      case ApiErrorType.RATE_LIMIT:
        return `Too many requests. Please wait ${this.retryAfter || 60} seconds.`;
      case ApiErrorType.UNAUTHORIZED:
        return 'Your session has expired. Please sign in again.';
      case ApiErrorType.FORBIDDEN:
        return 'You don\'t have permission to perform this action.';
      case ApiErrorType.NOT_FOUND:
        return 'The requested content could not be found.';
      case ApiErrorType.VALIDATION:
        return this.message || 'Please check your input and try again.';
      case ApiErrorType.SERVER:
        return 'Something went wrong on our end. Please try again later.';
      default:
        return this.message || 'An unexpected error occurred.';
    }
  }
}

/**
 * Parse API response errors
 */
export function parseApiError(response: Response, data?: any): ApiError {
  const status = response.status;

  // Rate limiting
  if (status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
    return new ApiError({
      type: ApiErrorType.RATE_LIMIT,
      message: data?.error?.message || 'Rate limit exceeded',
      status,
      retryAfter,
    });
  }

  // Authentication
  if (status === 401) {
    return new ApiError({
      type: ApiErrorType.UNAUTHORIZED,
      message: data?.error?.message || 'Authentication required',
      status,
    });
  }

  // Forbidden
  if (status === 403) {
    return new ApiError({
      type: ApiErrorType.FORBIDDEN,
      message: data?.error?.message || 'Access denied',
      status,
    });
  }

  // Not found
  if (status === 404) {
    return new ApiError({
      type: ApiErrorType.NOT_FOUND,
      message: data?.error?.message || 'Resource not found',
      status,
    });
  }

  // Validation errors
  if (status === 400 || status === 422) {
    return new ApiError({
      type: ApiErrorType.VALIDATION,
      message: data?.error?.message || 'Validation failed',
      status,
      field: data?.error?.field,
    });
  }

  // Server errors
  if (status >= 500) {
    return new ApiError({
      type: ApiErrorType.SERVER,
      message: data?.error?.message || 'Server error',
      status,
    });
  }

  // Unknown error
  return new ApiError({
    type: ApiErrorType.UNKNOWN,
    message: data?.error?.message || 'An error occurred',
    status,
  });
}

/**
 * Parse network/fetch errors
 */
export function parseNetworkError(error: Error): ApiError {
  // Check for common network error patterns
  const message = error.message.toLowerCase();
  
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('timeout') ||
    message.includes('abort') ||
    message.includes('connection')
  ) {
    return new ApiError({
      type: ApiErrorType.NETWORK,
      message: 'Network error',
      originalError: error,
    });
  }

  return new ApiError({
    type: ApiErrorType.UNKNOWN,
    message: error.message,
    originalError: error,
  });
}

/**
 * Handle API error with appropriate UI feedback
 */
export function handleApiError(
  error: ApiError | Error,
  options?: {
    showAlert?: boolean;
    onUnauthorized?: () => void;
    onRateLimit?: (retryAfter: number) => void;
    onNetworkError?: () => void;
  }
): void {
  const apiError = error instanceof ApiError ? error : parseNetworkError(error);
  const { showAlert = true, onUnauthorized, onRateLimit, onNetworkError } = options || {};

  // Handle specific error types
  switch (apiError.type) {
    case ApiErrorType.UNAUTHORIZED:
      if (onUnauthorized) {
        onUnauthorized();
      } else if (showAlert) {
        Alert.alert('Session Expired', apiError.getUserMessage(), [
          { text: 'OK' }
        ]);
      }
      break;

    case ApiErrorType.RATE_LIMIT:
      if (onRateLimit) {
        onRateLimit(apiError.retryAfter || 60);
      } else if (showAlert) {
        Alert.alert('Slow Down', apiError.getUserMessage(), [
          { text: 'OK' }
        ]);
      }
      break;

    case ApiErrorType.NETWORK:
      if (onNetworkError) {
        onNetworkError();
      } else if (showAlert) {
        Alert.alert('Connection Error', apiError.getUserMessage(), [
          { text: 'OK' }
        ]);
      }
      break;

    default:
      if (showAlert) {
        Alert.alert('Error', apiError.getUserMessage(), [
          { text: 'OK' }
        ]);
      }
  }
}

/**
 * React Query error handler
 */
export function createQueryErrorHandler(options?: {
  onUnauthorized?: () => void;
}) {
  return (error: Error) => {
    const apiError = error instanceof ApiError ? error : parseNetworkError(error);
    
    // Don't show alerts for all errors in React Query
    // Let components handle their own error states
    if (apiError.type === ApiErrorType.UNAUTHORIZED && options?.onUnauthorized) {
      options.onUnauthorized();
    }
  };
}

/**
 * Retry configuration for rate-limited requests
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
};

/**
 * Calculate delay for retry with exponential backoff
 */
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  retryAfter?: number
): number {
  // If server specified retry-after, use that
  if (retryAfter) {
    return retryAfter * 1000;
  }

  // Exponential backoff with jitter
  const exponentialDelay = config.baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 1000;
  const delay = Math.min(exponentialDelay + jitter, config.maxDelay);
  
  return delay;
}

/**
 * Should retry the request?
 */
export function shouldRetry(
  error: ApiError | Error,
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): boolean {
  if (attempt >= config.maxRetries) {
    return false;
  }

  const apiError = error instanceof ApiError ? error : parseNetworkError(error);

  // Retry on network errors
  if (apiError.type === ApiErrorType.NETWORK) {
    return true;
  }

  // Retry on rate limit (after waiting)
  if (apiError.type === ApiErrorType.RATE_LIMIT) {
    return true;
  }

  // Retry on server errors
  if (apiError.type === ApiErrorType.SERVER) {
    return true;
  }

  // Don't retry on client errors
  return false;
}

/**
 * Wrapper for fetch with automatic retry
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Check for rate limiting
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
        const error = new ApiError({
          type: ApiErrorType.RATE_LIMIT,
          message: 'Rate limit exceeded',
          status: 429,
          retryAfter,
        });

        if (shouldRetry(error, attempt, retryConfig)) {
          const delay = calculateRetryDelay(attempt, retryConfig, retryAfter);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw error;
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      
      if (shouldRetry(error as Error, attempt, retryConfig)) {
        const delay = calculateRetryDelay(attempt, retryConfig);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }

  throw lastError || new Error('Max retries exceeded');
}
