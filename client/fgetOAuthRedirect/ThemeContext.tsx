import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export const ThemeColors = {
  light: {
    background: '#F5F7FA',
    backgroundSecondary: '#EBEEF2',
    backgroundTertiary: '#E1E5EB',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    textPrimary: '#1A1D21',
    textSecondary: '#5F6368',
    textTertiary: '#9AA0A6',
    textInverse: '#FFFFFF',
    primary: '#1E88E5',
    primaryDark: '#1565C0',
    primaryLight: '#64B5F6',
    secondary: '#00897B',
    secondaryDark: '#00695C',
    success: '#34A853',
    warning: '#FBBC04',
    error: '#EA4335',
    info: '#4285F4',
    border: '#E0E4E8',
    borderLight: '#F0F2F4',
    divider: '#E8EAED',
    overlay: 'rgba(0, 0, 0, 0.5)',
    card: '#FFFFFF',
    input: '#F5F7FA',
    inputFocused: '#FFFFFF',
    tabBar: '#FFFFFF',
    statusBar: 'dark-content',
  },
  dark: {
    background: '#121212',
    backgroundSecondary: '#1E1E1E',
    backgroundTertiary: '#2D2D2D',
    surface: '#1E1E1E',
    surfaceElevated: '#2D2D2D',
    textPrimary: '#E8EAED',
    textSecondary: '#9AA0A6',
    textTertiary: '#5F6368',
    textInverse: '#1A1D21',
    primary: '#64B5F6',
    primaryDark: '#1E88E5',
    primaryLight: '#90CAF9',
    secondary: '#4DB6AC',
    secondaryDark: '#00897B',
    success: '#81C784',
    warning: '#FFD54F',
    error: '#E57373',
    info: '#64B5F6',
    border: '#3D3D3D',
    borderLight: '#2D2D2D',
    divider: '#3D3D3D',
    overlay: 'rgba(0, 0, 0, 0.7)',
    card: '#1E1E1E',
    input: '#2D2D2D',
    inputFocused: '#3D3D3D',
    tabBar: '#1E1E1E',
    statusBar: 'light-content',
  },
};

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: typeof ThemeColors.light;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app_theme_mode';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(() => {
      if (mode === 'system') {
        setModeState('system');
      }
    });
    return () => subscription.remove();
  }, [mode]);

  const loadThemePreference = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
        setModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setMode(newMode);
  };

  const isDark = mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');
  const colors = isDark ? ThemeColors.dark : ThemeColors.light;

  const value: ThemeContextType = {
    mode,
    isDark,
    colors,
    setMode,
    toggleTheme,
  };

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

export function useColors() {
  const { colors } = useThemeContext();
  return colors;
}

export function useIsDarkMode() {
  const { isDark } = useThemeContext();
  return isDark;
}
