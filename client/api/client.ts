import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '@/lib/query-client';

const AUTH_TOKEN_KEY = '@medinvest/auth_token';

export interface ApiError {
  status?: number;
  message: string;
  errors?: Record<string, string[]>;
  isNetworkError?: boolean;
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  );
}

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }
  return {};
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401) {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    }
    
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {}
    
    throw {
      status: response.status,
      message: errorData.message || 'An error occurred',
      errors: errorData.errors,
    } as ApiError;
  }
  
  return response.json();
}

export const apiClient = {
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<{ data: T }> {
    const baseUrl = getApiUrl();
    const url = new URL(endpoint, baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    const authHeader = await getAuthHeader();
    
    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
      });
      
      const data = await handleResponse<T>(response);
      return { data };
    } catch (error) {
      if (error instanceof TypeError) {
        throw {
          message: 'Network error. Please check your connection.',
          isNetworkError: true,
        } as ApiError;
      }
      throw error;
    }
  },
  
  async post<T>(endpoint: string, body?: any, config?: { headers?: Record<string, string> }): Promise<{ data: T }> {
    const baseUrl = getApiUrl();
    const url = new URL(endpoint, baseUrl);
    const authHeader = await getAuthHeader();
    
    const isFormData = body instanceof FormData;
    
    try {
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
          ...authHeader,
          ...config?.headers,
        },
        body: isFormData ? body : body ? JSON.stringify(body) : undefined,
      });
      
      const data = await handleResponse<T>(response);
      return { data };
    } catch (error) {
      if (error instanceof TypeError) {
        throw {
          message: 'Network error. Please check your connection.',
          isNetworkError: true,
        } as ApiError;
      }
      throw error;
    }
  },
  
  async patch<T>(endpoint: string, body?: any): Promise<{ data: T }> {
    const baseUrl = getApiUrl();
    const url = new URL(endpoint, baseUrl);
    const authHeader = await getAuthHeader();
    
    try {
      const response = await fetch(url.toString(), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      
      const data = await handleResponse<T>(response);
      return { data };
    } catch (error) {
      if (error instanceof TypeError) {
        throw {
          message: 'Network error. Please check your connection.',
          isNetworkError: true,
        } as ApiError;
      }
      throw error;
    }
  },
  
  async delete<T>(endpoint: string): Promise<{ data: T }> {
    const baseUrl = getApiUrl();
    const url = new URL(endpoint, baseUrl);
    const authHeader = await getAuthHeader();
    
    try {
      const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
      });
      
      const data = await handleResponse<T>(response);
      return { data };
    } catch (error) {
      if (error instanceof TypeError) {
        throw {
          message: 'Network error. Please check your connection.',
          isNetworkError: true,
        } as ApiError;
      }
      throw error;
    }
  },
};
