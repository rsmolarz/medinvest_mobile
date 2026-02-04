import { useEffect } from 'react';
import { Linking, Platform } from 'react-native';
import * as ExpoLinking from 'expo-linking';
import { useNavigation, type NavigationContainerRef } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/navigation/types';

/**
 * Deep link URL scheme
 * - medinvest:// for native deep links
 * - https://medinvest.app for universal links
 */
const DEEP_LINK_PREFIXES = [
  ExpoLinking.createURL('/'),
  'medinvest://',
  'https://medinvest.app',
  'https://www.medinvest.app',
];

/**
 * Navigation linking configuration
 * Maps URLs to screens
 */
export const linkingConfig = {
  prefixes: DEEP_LINK_PREFIXES,
  config: {
    screens: {
      // Main tabs
      Main: {
        screens: {
          Discover: 'discover',
          Portfolio: 'portfolio',
          Research: 'research',
          Profile: 'profile',
        },
      },
      
      // Investment detail
      InvestmentDetail: {
        path: 'investment/:investmentId',
        parse: {
          investmentId: (id: string) => id,
        },
      },
      
      // Invest modal
      InvestModal: {
        path: 'invest/:investmentId?',
        parse: {
          investmentId: (id: string) => id,
        },
      },
      
      // Settings screens
      Settings: 'settings',
      Documents: 'documents',
      PaymentMethods: 'payment-methods',
      Support: 'support',
      Legal: 'legal',
      
      // Auth (when not authenticated)
      Auth: {
        screens: {
          Login: 'login',
          Signup: 'signup',
          ForgotPassword: 'forgot-password',
          VerifyEmail: {
            path: 'verify-email/:email',
            parse: {
              email: (email: string) => decodeURIComponent(email),
            },
          },
        },
      },
    },
  },
};

/**
 * Parse deep link URL into navigation params
 */
export function parseDeepLink(url: string): {
  screen?: keyof RootStackParamList;
  params?: Record<string, any>;
} | null {
  try {
    const { path, queryParams } = ExpoLinking.parse(url);
    
    if (!path) return null;

    // Handle different paths
    const segments = path.split('/').filter(Boolean);
    
    switch (segments[0]) {
      case 'investment':
        return {
          screen: 'InvestmentDetail',
          params: { investmentId: segments[1] },
        };
        
      case 'invest':
        return {
          screen: 'InvestModal',
          params: segments[1] ? { investmentId: segments[1] } : undefined,
        };
        
      case 'discover':
        return {
          screen: 'Main',
          params: { screen: 'Discover' },
        };
        
      case 'portfolio':
        return {
          screen: 'Main',
          params: { screen: 'Portfolio' },
        };
        
      case 'research':
        return {
          screen: 'Main',
          params: { screen: 'Research' },
        };
        
      case 'profile':
        return {
          screen: 'Main',
          params: { screen: 'Profile' },
        };
        
      case 'settings':
        return { screen: 'Settings' };
        
      default:
        return null;
    }
  } catch (error) {
    console.error('Failed to parse deep link:', error);
    return null;
  }
}

/**
 * Generate a deep link URL
 */
export function createDeepLink(
  screen: string,
  params?: Record<string, any>
): string {
  let path = '';
  
  switch (screen) {
    case 'InvestmentDetail':
      path = `investment/${params?.investmentId}`;
      break;
      
    case 'InvestModal':
      path = params?.investmentId ? `invest/${params.investmentId}` : 'invest';
      break;
      
    case 'Discover':
      path = 'discover';
      break;
      
    case 'Portfolio':
      path = 'portfolio';
      break;
      
    case 'Research':
      path = 'research';
      break;
      
    case 'Profile':
      path = 'profile';
      break;
      
    default:
      path = screen.toLowerCase();
  }
  
  return ExpoLinking.createURL(path);
}

/**
 * Hook for handling deep links
 */
export function useDeepLinks() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    // Handle initial URL (app opened from deep link)
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      
      if (initialUrl) {
        const parsed = parseDeepLink(initialUrl);
        
        if (parsed?.screen) {
          // Small delay to ensure navigation is ready
          setTimeout(() => {
            navigation.navigate(parsed.screen as any, parsed.params);
          }, 100);
        }
      }
    };

    handleInitialURL();

    // Handle deep links while app is running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      const parsed = parseDeepLink(url);
      
      if (parsed?.screen) {
        navigation.navigate(parsed.screen as any, parsed.params);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [navigation]);
}

/**
 * Share an investment with deep link
 */
export async function shareInvestment(
  investmentId: string,
  investmentName: string
): Promise<void> {
  const url = createDeepLink('InvestmentDetail', { investmentId });
  
  await Linking.openURL(
    Platform.select({
      ios: `sms:&body=Check out ${investmentName} on MedInvest: ${url}`,
      android: `sms:?body=Check out ${investmentName} on MedInvest: ${url}`,
      default: url,
    })!
  );
}

/**
 * Open external URL safely
 */
export async function openExternalURL(url: string): Promise<boolean> {
  try {
    const supported = await Linking.canOpenURL(url);
    
    if (supported) {
      await Linking.openURL(url);
      return true;
    }
    
    console.warn('Cannot open URL:', url);
    return false;
  } catch (error) {
    console.error('Failed to open URL:', error);
    return false;
  }
}

/**
 * Open email client
 */
export async function openEmail(
  to: string,
  subject?: string,
  body?: string
): Promise<void> {
  let url = `mailto:${to}`;
  
  const params: string[] = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  
  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }
  
  await openExternalURL(url);
}

/**
 * Open phone dialer
 */
export async function openPhone(number: string): Promise<void> {
  await openExternalURL(`tel:${number}`);
}
