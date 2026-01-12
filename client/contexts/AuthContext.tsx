import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { apiClient } from '@/api/client';
import type { User } from '@/types';

WebBrowser.maybeCompleteAuthSession();

const AUTH_TOKEN_KEY = '@medinvest/auth_token';
const USER_DATA_KEY = '@medinvest/user_data';

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  mockSignIn: () => Promise<void>;
  isAppleAuthAvailable: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState(false);

  useEffect(() => {
    const checkAppleAuth = async () => {
      if (Platform.OS === 'ios') {
        try {
          const available = await AppleAuthentication.isAvailableAsync();
          setIsAppleAuthAvailable(available);
        } catch {
          setIsAppleAuthAvailable(false);
        }
      }
    };
    checkAppleAuth();
  }, []);

  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(AUTH_TOKEN_KEY),
          AsyncStorage.getItem(USER_DATA_KEY),
        ]);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Failed to load stored auth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  const saveAuthData = async (authToken: string, userData: User) => {
    await Promise.all([
      AsyncStorage.setItem(AUTH_TOKEN_KEY, authToken),
      AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData)),
    ]);

    setToken(authToken);
    setUser(userData);
  };

  const clearAuthData = async () => {
    await Promise.all([
      AsyncStorage.removeItem(AUTH_TOKEN_KEY),
      AsyncStorage.removeItem(USER_DATA_KEY),
    ]);

    setToken(null);
    setUser(null);
  };

  const signInWithApple = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { identityToken, email, fullName } = credential;

      if (!identityToken) {
        throw new Error('No identity token received from Apple');
      }

      const mockUser: User = {
        id: credential.user,
        email: email || 'user@apple.com',
        firstName: fullName?.givenName || undefined,
        lastName: fullName?.familyName || undefined,
        fullName: fullName ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim() : undefined,
        provider: 'apple',
        isVerified: true,
        createdAt: new Date().toISOString(),
      };

      await saveAuthData(identityToken, mockUser);
    } catch (err: any) {
      if (err.code === 'ERR_REQUEST_CANCELED') {
        return;
      }

      const message = err instanceof Error ? err.message : 'Apple sign-in failed';
      setError(message);
      console.error('Apple sign-in error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      setError(null);
      setError('Google sign-in is not configured. Please use the demo login or Apple Sign-In on iOS.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      setError(message);
      console.error('Google sign-in error:', err);
    }
  }, []);

  const mockSignIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const mockUser: User = {
        id: 'demo-user-123',
        email: 'demo@medinvest.com',
        firstName: 'Demo',
        lastName: 'User',
        fullName: 'Demo User',
        avatarUrl: undefined,
        provider: 'mock',
        isVerified: true,
        createdAt: new Date().toISOString(),
      };

      await saveAuthData('mock-token-' + Date.now(), mockUser);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Demo sign-in failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      await clearAuthData();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await apiClient.get('/users/me');
      const userData = response.data as User;
      
      setUser(userData);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    } catch (error: any) {
      console.error('Failed to refresh user:', error);
      if (error?.status === 401 || error?.response?.status === 401) {
        await clearAuthData();
      }
    }
  }, [token]);

  const updateUser = useCallback(async (userData: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
  }, [user]);

  const isAuthenticated = useMemo(() => {
    return !!user && !!token;
  }, [user, token]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated,
      error,
      signInWithApple,
      signInWithGoogle,
      signOut,
      clearError,
      refreshUser,
      updateUser,
      mockSignIn,
      isAppleAuthAvailable,
    }),
    [
      user,
      token,
      isLoading,
      isAuthenticated,
      error,
      signInWithApple,
      signInWithGoogle,
      signOut,
      clearError,
      refreshUser,
      updateUser,
      mockSignIn,
      isAppleAuthAvailable,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export default AuthContext;
