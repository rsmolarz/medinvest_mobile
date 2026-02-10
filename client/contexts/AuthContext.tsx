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
import { Platform, Linking } from 'react-native';
import { apiClient } from '@/api/client';
import { getApiUrl } from '@/lib/query-client';
import type { User } from '@/types';
import { AUTH_TOKEN_KEY, USER_DATA_KEY } from '@/constants/auth';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const FACEBOOK_APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  specialty?: string;
  referral_code?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthContextType extends AuthState {
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signOut: () => Promise<void>;
  register: (data: RegisterData) => Promise<boolean>;
  login: (data: LoginData) => Promise<boolean>;
  setAuthSession: (token: string, user: User) => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  mockSignIn: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
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

  if (__DEV__) {
    console.log('[OAuth] Platform:', Platform.OS);
    console.log('[OAuth] Google Web Client ID:', GOOGLE_WEB_CLIENT_ID ? 'configured' : 'missing');
    console.log('[OAuth] Facebook App ID:', FACEBOOK_APP_ID ? 'configured' : 'missing');
  }

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
        const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

        if (storedToken) {
          setToken(storedToken);
          
          try {
            const response = await apiClient.get('/users/me', {
              headers: { Authorization: `Bearer ${storedToken}` },
            });
            const userData = response.data as User;
            setUser(userData);
            await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
          } catch (error: any) {
            console.error('Failed to fetch user on startup:', error);
            if (error?.status === 401 || error?.response?.status === 401) {
              await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
              await AsyncStorage.removeItem(USER_DATA_KEY);
              setToken(null);
              setUser(null);
            } else {
              const storedUser = await AsyncStorage.getItem(USER_DATA_KEY);
              if (storedUser) {
                setUser(JSON.parse(storedUser));
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load stored auth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof window === 'undefined') return;
    
    const checkOAuthCookie = async () => {
      try {
        const cookies = document.cookie.split(';').reduce((acc: Record<string, string>, c) => {
          const [key, ...val] = c.trim().split('=');
          if (key) acc[key] = decodeURIComponent(val.join('='));
          return acc;
        }, {});

        const authToken = cookies['medinvest_auth_token'];
        const authUserRaw = cookies['medinvest_auth_user'];

        if (!authToken) return;

        console.log('[OAuth] Found auth cookie from server-side callback');

        document.cookie = 'medinvest_auth_token=; Path=/; Max-Age=0; SameSite=Lax; Secure';
        document.cookie = 'medinvest_auth_user=; Path=/; Max-Age=0; SameSite=Lax; Secure';

        let userData: User | null = null;
        if (authUserRaw) {
          try {
            userData = JSON.parse(authUserRaw);
          } catch {}
        }

        if (userData) {
          await saveAuthData(authToken, userData);
          console.log('[OAuth] Logged in via server-side callback:', userData.email);
        } else {
          try {
            const response = await apiClient.get('/users/me', {
              headers: { Authorization: `Bearer ${authToken}` },
            });
            await saveAuthData(authToken, response.data as User);
            console.log('[OAuth] Logged in via API verification');
          } catch (err) {
            console.error('[OAuth] Failed to verify token from cookie:', err);
          }
        }
      } catch (err) {
        console.error('[OAuth] Cookie check error:', err);
      }
    };

    checkOAuthCookie();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const handleOAuthDeepLink = async (url: string) => {
      try {
        const parsed = new URL(url.replace('medinvest://', 'https://medinvest.app/'));
        const authToken = parsed.searchParams.get('token');
        const error = parsed.searchParams.get('error');

        if (error) {
          console.error('[OAuth] Deep link error:', error);
          setError(decodeURIComponent(error));
          return;
        }

        if (authToken && parsed.pathname === '/auth') {
          console.log('[OAuth] Received token via deep link');
          setIsLoading(true);
          try {
            const response = await apiClient.get('/users/me', {
              headers: { Authorization: `Bearer ${authToken}` },
            });
            await saveAuthData(authToken, response.data as User);
            console.log('[OAuth] Logged in via deep link callback');
          } catch (err) {
            console.error('[OAuth] Failed to verify deep link token:', err);
            setError('Failed to complete sign-in. Please try again.');
          } finally {
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error('[OAuth] Deep link parse error:', err);
      }
    };

    const handleUrl = ({ url }: { url: string }) => {
      if (url.includes('auth') && (url.includes('token=') || url.includes('error='))) {
        handleOAuthDeepLink(url);
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    const subscription = Linking.addEventListener('url', handleUrl);
    return () => subscription.remove();
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

  const authenticateWithBackend = useCallback(async (
    provider: 'apple' | 'google' | 'github' | 'facebook',
    tokenData: {
      token: string;
      identityToken?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      avatarUrl?: string;
    }
  ) => {
    const maxRetries = 2;
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`[Auth] Retry attempt ${attempt} for ${provider} login`);
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }

        const response = await apiClient.post('/auth/social', {
          provider,
          ...tokenData,
        });

        const { token: authToken, user: userData } = response.data as {
          token: string;
          user: User;
        };

        await saveAuthData(authToken, userData);
        return;
      } catch (err: any) {
        lastError = err;
        if (!err?.isNetworkError) {
          throw err;
        }
        console.warn(`[Auth] Network error on attempt ${attempt + 1}:`, err?.url || 'unknown URL');
      }
    }

    throw lastError;
  }, []);

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

      await authenticateWithBackend('apple', {
        token: credential.user,
        identityToken,
        email: email || undefined,
        firstName: fullName?.givenName || undefined,
        lastName: fullName?.familyName || undefined,
      });
    } catch (err: any) {
      if (err.code === 'ERR_REQUEST_CANCELED' || err.code === 'ERR_CANCELED') {
        return;
      }

      if (err?.isNetworkError) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
        console.error('[Auth] Apple sign-in network error. API URL:', err?.url);
      } else {
        const message = err instanceof Error ? err.message : (err?.message || 'Apple sign-in failed');
        setError(message);
      }
      console.error('[Auth] Apple sign-in error:', JSON.stringify(err));
    } finally {
      setIsLoading(false);
    }
  }, [authenticateWithBackend]);

  const [isOAuthInProgress, setIsOAuthInProgress] = useState(false);

  const handleServerSideOAuth = useCallback(async (provider: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const baseUrl = getApiUrl();
      const mobileCallbackUrl = `${baseUrl}api/auth/mobile-callback`;
      const serverStartUrl = `${baseUrl}api/auth/${provider}/start?app_redirect_uri=${encodeURIComponent(mobileCallbackUrl)}`;
      console.log(`[OAuth] Opening server-side ${provider} OAuth:`, serverStartUrl);
      console.log(`[OAuth] Mobile callback URL:`, mobileCallbackUrl);

      const result = await WebBrowser.openAuthSessionAsync(
        serverStartUrl,
        mobileCallbackUrl
      );

      console.log(`[OAuth] ${provider} browser result type:`, result.type);

      if (result.type === 'success' && result.url) {
        console.log(`[OAuth] Result URL:`, result.url);
        let tokenFromUrl: string | null = null;
        let errorFromUrl: string | null = null;

        try {
          const parsed = new URL(result.url);
          tokenFromUrl = parsed.searchParams.get('token');
          errorFromUrl = parsed.searchParams.get('error');
        } catch {
          const tokenMatch = result.url.match(/[?&]token=([^&]+)/);
          const errorMatch = result.url.match(/[?&]error=([^&]+)/);
          tokenFromUrl = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;
          errorFromUrl = errorMatch ? decodeURIComponent(errorMatch[1]) : null;
        }

        if (errorFromUrl) {
          setError(decodeURIComponent(errorFromUrl));
          return;
        }

        if (tokenFromUrl) {
          const response = await apiClient.get('/users/me', {
            headers: { Authorization: `Bearer ${tokenFromUrl}` },
          });
          await saveAuthData(tokenFromUrl, response.data as User);
          console.log(`[OAuth] Logged in via server-side ${provider} OAuth`);
        } else {
          console.log(`[OAuth] No token found in result URL`);
          setError('Authentication completed but no token received. Please try again.');
        }
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        console.log(`[OAuth] ${provider} sign-in cancelled by user`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : `${provider} sign-in failed`;
      setError(message);
      console.error(`[OAuth] ${provider} sign-in error:`, err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (isOAuthInProgress) {
      console.log('[OAuth] Another sign-in is already in progress');
      return;
    }
    console.log('[OAuth] Google Sign-In starting');

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const serverStartUrl = `${getApiUrl()}api/auth/google/start`;
      console.log('[OAuth] Redirecting to server-side Google OAuth start:', serverStartUrl);
      window.location.href = serverStartUrl;
      return;
    }

    await handleServerSideOAuth('google');
  }, [isOAuthInProgress, handleServerSideOAuth]);

  const signInWithGithub = useCallback(async () => {
    if (isOAuthInProgress) {
      console.log('[OAuth] Another sign-in is already in progress');
      return;
    }
    console.log('[OAuth] GitHub Sign-In starting');

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const serverStartUrl = `${getApiUrl()}api/auth/github/start`;
      console.log('[OAuth] Redirecting to server-side GitHub OAuth start:', serverStartUrl);
      window.location.href = serverStartUrl;
      return;
    }

    await handleServerSideOAuth('github');
  }, [isOAuthInProgress, handleServerSideOAuth]);

  const signInWithFacebook = useCallback(async () => {
    if (isOAuthInProgress) {
      console.log('[OAuth] Another sign-in is already in progress');
      return;
    }
    console.log('[OAuth] Facebook Sign-In starting');

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const serverStartUrl = `${getApiUrl()}api/auth/facebook/start`;
      console.log('[OAuth] Redirecting to server-side Facebook OAuth start:', serverStartUrl);
      window.location.href = serverStartUrl;
      return;
    }

    await handleServerSideOAuth('facebook');
  }, [isOAuthInProgress, handleServerSideOAuth]);

  const mockSignIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.post('/auth/demo');
      const { token: authToken, user: userData } = response.data;

      await saveAuthData(authToken, {
        ...userData,
        fullName: userData.fullName || [userData.firstName, userData.lastName].filter(Boolean).join(' '),
      });
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Demo sign-in failed';
      setError(message);
      console.error('Demo sign-in error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.post('/auth/register', data);
      const { token: authToken, user: userData } = response.data;

      await saveAuthData(authToken, {
        ...userData,
        fullName: userData.fullName || [userData.firstName, userData.lastName].filter(Boolean).join(' '),
      });

      return true;
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Registration failed';
      setError(message);
      console.error('Registration error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (data: LoginData): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.post('/auth/login', data);
      const { token: authToken, user: userData } = response.data;

      await saveAuthData(authToken, {
        ...userData,
        fullName: userData.fullName || [userData.firstName, userData.lastName].filter(Boolean).join(' '),
      });

      return true;
    } catch (err: any) {
      if (err?.isNetworkError) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
        console.error('[Auth] Login network error. API URL:', err?.url);
      } else {
        const message = err?.response?.data?.message || err?.message || 'Login failed';
        setError(message);
      }
      console.error('[Auth] Login error:', JSON.stringify(err));
      return false;
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

  const setAuthSession = useCallback(async (authToken: string, userData: User) => {
    const normalizedUser: User = {
      id: userData.id,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      full_name: userData.full_name || [userData.first_name, userData.last_name].filter(Boolean).join(' '),
      avatar_url: userData.avatar_url,
      provider: userData.provider,
      is_verified: userData.is_verified,
      is_accredited: userData.is_accredited,
      created_at: userData.created_at,
    };
    await saveAuthData(authToken, normalizedUser);
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      await apiClient.post('/auth/forgot-password', { email });
      return true;
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to send reset link';
      setError(message);
      console.error('Forgot password error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      signInWithGithub,
      signInWithFacebook,
      signOut,
      register,
      login,
      setAuthSession,
      clearError,
      refreshUser,
      updateUser,
      mockSignIn,
      forgotPassword,
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
      signInWithGithub,
      signInWithFacebook,
      signOut,
      register,
      login,
      setAuthSession,
      clearError,
      refreshUser,
      updateUser,
      mockSignIn,
      forgotPassword,
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
