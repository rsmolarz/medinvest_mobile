import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = '@medinvest/auth_token';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Axios instance with auth interceptors
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Add auth token
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle errors
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Handle 401 - Unauthorized
    if (error.response?.status === 401) {
      // Clear stored token
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      
      // You could emit an event here to trigger logout in AuthContext
      // eventEmitter.emit('unauthorized');
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        isNetworkError: true,
      });
    }

    // Handle API errors
    const apiError = {
      status: error.response.status,
      message: (error.response.data as any)?.message || 'An error occurred',
      errors: (error.response.data as any)?.errors,
    };

    return Promise.reject(apiError);
  }
);

/**
 * API Error type
 */
export interface ApiError {
  status?: number;
  message: string;
  errors?: Record<string, string[]>;
  isNetworkError?: boolean;
}

/**
 * Type guard for API errors
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  );
}
