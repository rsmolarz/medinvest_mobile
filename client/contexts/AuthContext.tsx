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
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiClient } from '@/api/client';
import type { User } from '@/types';
import { AUTH_TOKEN_KEY, USER_DATA_KEY } from '@/constants/auth';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_EXPO_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID;

const GITHUB_CLIENT_ID = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID;
const FACEBOOK_APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;

const PLACEHOLDER_CLIENT_ID = 'placeholder.apps.googleusercontent.com';

function getHasGoogleCredentialsForPlatform(): boolean {
  const isExpoGo = Constants.appOwnership === 'expo';
  
  if (Platform.OS === 'web') {
    return !!GOOGLE_WEB_CLIENT_ID;
  } else if (Platform.OS === 'ios') {
    return isExpoGo ? !!GOOGLE_EXPO_CLIENT_ID : !!GOOGLE_IOS_CLIENT_ID;
  } else if (Platform.OS === 'android') {
    return isExpoGo ? !!GOOGLE_EXPO_CLIENT_ID : !!GOOGLE_ANDROID_CLIENT_ID;
  }
  return false;
}

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

  const [_googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    clientId: GOOGLE_EXPO_CLIENT_ID || PLACEHOLDER_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID || PLACEHOLDER_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID || PLACEHOLDER_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || PLACEHOLDER_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  // GitHub OAuth configuration
  const githubDiscovery = {
    authorizationEndpoint: 'https://github.com/login/oauth/authorize',
    tokenEndpoint: 'https://github.com/login/oauth/access_token',
    revocationEndpoint: `https://github.com/settings/connections/applications/${GITHUB_CLIENT_ID}`,
  };

  // Use platform-appropriate redirect URI for GitHub
  const githubRedirectUri = Platform.OS === 'web'
    ? AuthSession.makeRedirectUri({ preferLocalhost: false })
    : AuthSession.makeRedirectUri({ scheme: 'medinvest' });

  const [_githubRequest, githubResponse, promptGithubAsync] = AuthSession.useAuthRequest(
    {
      clientId: GITHUB_CLIENT_ID || 'placeholder',
      scopes: ['read:user', 'user:email'],
      redirectUri: githubRedirectUri,
    },
    githubDiscovery
  );

  // Facebook OAuth configuration
  const facebookDiscovery = {
    authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
  };

  // Use platform-appropriate redirect URI for Facebook
  const facebookRedirectUri = Platform.OS === 'web'
    ? AuthSession.makeRedirectUri({ preferLocalhost: false })
    : AuthSession.makeRedirectUri({ scheme: 'medinvest' });

  const [_facebookRequest, facebookResponse, promptFacebookAsync] = AuthSession.useAuthRequest(
    {
      clientId: FACEBOOK_APP_ID || 'placeholder',
      scopes: ['public_profile', 'email'],
      redirectUri: facebookRedirectUri,
      responseType: AuthSession.ResponseType.Code,
    },
    facebookDiscovery
  );

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
    const response = await apiClient.post('/auth/social', {
      provider,
      ...tokenData,
    });

    const { token: authToken, user: userData } = response.data as {
      token: string;
      user: User;
    };

    await saveAuthData(authToken, userData);
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
      if (err.code === 'ERR_REQUEST_CANCELED') {
        return;
      }

      const message = err instanceof Error ? err.message : 'Apple sign-in failed';
      setError(message);
      console.error('Apple sign-in error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [authenticateWithBackend]);

  const handleGoogleResponse = useCallback(async () => {
    if (googleResponse?.type === 'success') {
      const { authentication } = googleResponse;
      if (authentication?.accessToken) {
        try {
          setIsLoading(true);
          setError(null);

          await authenticateWithBackend('google', {
            token: authentication.accessToken,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Google sign-in failed';
          setError(message);
          console.error('Google sign-in error:', err);
        } finally {
          setIsLoading(false);
        }
      }
    }
  }, [googleResponse, authenticateWithBackend]);

  useEffect(() => {
    handleGoogleResponse();
  }, [handleGoogleResponse]);

  // Handle GitHub OAuth response
  const handleGithubResponse = useCallback(async () => {
    if (githubResponse?.type === 'success') {
      const { code } = githubResponse.params;
      if (code) {
        try {
          setIsLoading(true);
          setError(null);

          // Exchange code for access token via backend (use same redirect URI as auth request)
          const redirectUri = Platform.OS === 'web'
            ? AuthSession.makeRedirectUri({ preferLocalhost: false })
            : AuthSession.makeRedirectUri({ scheme: 'medinvest' });
          
          const tokenResponse = await apiClient.post('/auth/github/token', {
            code,
            redirect_uri: redirectUri,
          });

          const { access_token } = tokenResponse.data;
          if (access_token) {
            await authenticateWithBackend('github', {
              token: access_token,
            });
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'GitHub sign-in failed';
          setError(message);
          console.error('GitHub sign-in error:', err);
        } finally {
          setIsLoading(false);
        }
      }
    }
  }, [githubResponse, authenticateWithBackend]);

  useEffect(() => {
    handleGithubResponse();
  }, [handleGithubResponse]);

  // Handle Facebook OAuth response
  const handleFacebookResponse = useCallback(async () => {
    if (facebookResponse?.type === 'success') {
      const { code } = facebookResponse.params;
      if (code) {
        try {
          setIsLoading(true);
          setError(null);

          // Exchange code for access token via backend
          const redirectUri = Platform.OS === 'web'
            ? AuthSession.makeRedirectUri({ preferLocalhost: false })
            : AuthSession.makeRedirectUri({ scheme: 'medinvest' });
          
          const tokenResponse = await apiClient.post('/auth/facebook/token', {
            code,
            redirect_uri: redirectUri,
          });

          const { access_token } = tokenResponse.data;
          if (access_token) {
            await authenticateWithBackend('facebook', {
              token: access_token,
            });
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Facebook sign-in failed';
          setError(message);
          console.error('Facebook sign-in error:', err);
        } finally {
          setIsLoading(false);
        }
      }
    }
  }, [facebookResponse, authenticateWithBackend]);

  useEffect(() => {
    handleFacebookResponse();
  }, [handleFacebookResponse]);

  const signInWithGoogle = useCallback(async () => {
    try {
      setError(null);
      console.log('Google Sign-In: Starting...');
      console.log('Google Web Client ID:', GOOGLE_WEB_CLIENT_ID ? 'Set' : 'Not set');
      console.log('Platform:', Platform.OS);
      console.log('Has credentials:', getHasGoogleCredentialsForPlatform());

      if (!getHasGoogleCredentialsForPlatform()) {
        const errorMsg = Platform.OS === 'web' 
          ? 'Google Sign-In is not configured. Please contact support.'
          : 'Google Sign-In is not available on this device. Please use Apple Sign-In or email login.';
        console.log('Google Sign-In Error:', errorMsg);
        setError(errorMsg);
        return;
      }

      console.log('Google Sign-In: Prompting...');
      const result = await promptGoogleAsync();
      console.log('Google Sign-In result:', result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      setError(message);
      console.error('Google sign-in error:', err);
    }
  }, [promptGoogleAsync]);

  const signInWithGithub = useCallback(async () => {
    try {
      setError(null);
      console.log('GitHub Sign-In: Starting...');
      console.log('GitHub Client ID:', GITHUB_CLIENT_ID ? 'Set' : 'Not set');

      if (!GITHUB_CLIENT_ID) {
        setError('GitHub Sign-In is not configured. Please contact support.');
        return;
      }

      console.log('GitHub Sign-In: Prompting...');
      const result = await promptGithubAsync();
      console.log('GitHub Sign-In result:', result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'GitHub sign-in failed';
      setError(message);
      console.error('GitHub sign-in error:', err);
    }
  }, [promptGithubAsync]);

  const signInWithFacebook = useCallback(async () => {
    try {
      setError(null);
      console.log('Facebook Sign-In: Starting...');
      console.log('Facebook App ID:', FACEBOOK_APP_ID ? 'Set' : 'Not set');

      if (!FACEBOOK_APP_ID) {
        setError('Facebook Sign-In is not configured. Please contact support.');
        return;
      }

      console.log('Facebook Sign-In: Prompting...');
      const result = await promptFacebookAsync();
      console.log('Facebook Sign-In result:', result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Facebook sign-in failed';
      setError(message);
      console.error('Facebook sign-in error:', err);
    }
  }, [promptFacebookAsync]);

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
      const message = err?.response?.data?.message || err?.message || 'Login failed';
      setError(message);
      console.error('Login error:', err);
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
      firstName: userData.firstName,
      lastName: userData.lastName,
      fullName: userData.fullName || [userData.firstName, userData.lastName].filter(Boolean).join(' '),
      avatarUrl: userData.avatarUrl,
      provider: userData.provider,
      isVerified: userData.isVerified,
      isAccredited: userData.isAccredited,
      createdAt: userData.createdAt,
    };
    await saveAuthData(authToken, normalizedUser);
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
