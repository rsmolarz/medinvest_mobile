import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { AUTH_TOKEN_KEY } from '@/constants/auth';

function getApiBaseUrl(): string {
  const extraApiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl;
  if (extraApiBaseUrl) {
    return `${extraApiBaseUrl}/api`;
  }
  
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) {
    const protocol = domain.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${domain}/api`;
  }
  
  console.warn('[API] No API base URL configured, using localhost fallback');
  return 'http://localhost:5000/api';
}

const API_BASE_URL = getApiBaseUrl();

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
