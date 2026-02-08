/**
 * Deep Linking Configuration
 * Handle app links and universal links
 */

import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { RootStackParamList } from '@/types';

// URL scheme prefixes
const SCHEME = 'medinvest';
const UNIVERSAL_LINK_DOMAINS = ['app.medinvest.com', 'medinvest.com'];

/**
 * Deep linking configuration for React Navigation
 */
export const linkingConfig: LinkingOptions<RootStackParamList> = {
  prefixes: [
    Linking.createURL('/'),
    `${SCHEME}://`,
    ...UNIVERSAL_LINK_DOMAINS.map(domain => `https://${domain}`),
  ],
  
  config: {
    screens: {
      // Auth screens
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register',
          ForgotPassword: 'forgot-password',
          VerifyEmail: 'verify-email/:token',
          ResetPassword: 'reset-password/:token',
        },
      },
      
      // Main tabs
      Main: {
        screens: {
          Home: 'feed',
          Discover: 'deals',
          Messages: 'messages',
          Profile: 'profile',
        },
      },
      
      // Content screens
      PostDetail: 'post/:postId',
      UserProfile: 'user/:userId',
      RoomDetail: 'room/:roomSlug',
      Hashtag: 'hashtag/:tag',
      DealDetail: 'deal/:dealId',
      AMADetail: 'ama/:amaId',
      CourseDetail: 'course/:courseId',
      EventDetail: 'event/:eventId',
      
      // Messaging
      Conversation: 'conversation/:userId',
      NewConversation: 'new-conversation',
      
      // Profile & Settings
      EditProfile: 'edit-profile',
      Followers: 'user/:userId/followers',
      Following: 'user/:userId/following',
      Bookmarks: 'bookmarks',
      Settings: 'settings',
      Premium: 'premium',
      
      // Gamification
      Leaderboard: 'leaderboard',
      Achievements: 'achievements',
      
      // AI Chat
      AIChat: 'ai-chat',
      
      // Other
      Notifications: 'notifications',
      Search: 'search',
      CreatePost: 'create-post',
    },
  },

  // Custom URL parsing
  getStateFromPath: (path, options) => {
    // Handle special URL patterns
    if (path.startsWith('/invite/')) {
      const code = path.replace('/invite/', '');
      return {
        routes: [
          {
            name: 'Auth',
            state: {
              routes: [
                {
                  name: 'Register',
                  params: { referralCode: code },
                },
              ],
            },
          },
        ],
      };
    }

    // Handle shared post URLs
    if (path.match(/^\/p\/[a-zA-Z0-9]+$/)) {
      const postId = path.replace('/p/', '');
      return {
        routes: [
          {
            name: 'Main',
            state: {
              routes: [{ name: 'Home' }],
            },
          },
          {
            name: 'PostDetail',
            params: { postId },
          },
        ],
      };
    }

    // Use default parsing
    return undefined;
  },
};

/**
 * Handle incoming deep links
 */
export async function handleDeepLink(url: string): Promise<{
  screen: string;
  params?: Record<string, unknown>;
} | null> {
  const parsed = Linking.parse(url);
  
  if (!parsed.path) return null;

  // Parse path segments
  const segments = parsed.path.split('/').filter(Boolean);
  
  if (segments.length === 0) return null;

  const [first, second, third] = segments;

  switch (first) {
    case 'post':
      return { screen: 'PostDetail', params: { postId: parseInt(second, 10) } };
    case 'user':
      if (third === 'followers') {
        return { screen: 'Followers', params: { userId: parseInt(second, 10), type: 'followers' } };
      }
      if (third === 'following') {
        return { screen: 'Followers', params: { userId: parseInt(second, 10), type: 'following' } };
      }
      return { screen: 'UserProfile', params: { userId: parseInt(second, 10) } };
    case 'room':
      return { screen: 'RoomDetail', params: { roomSlug: second } };
    case 'deal':
      return { screen: 'DealDetail', params: { dealId: parseInt(second, 10) } };
    case 'ama':
      return { screen: 'AMADetail', params: { amaId: parseInt(second, 10) } };
    case 'hashtag':
      return { screen: 'Hashtag', params: { tag: second } };
    case 'conversation':
      return { screen: 'Conversation', params: { userId: parseInt(second, 10) } };
    case 'invite':
      return { screen: 'Register', params: { referralCode: second } };
    case 'verify-email':
      return { screen: 'VerifyEmail', params: { token: second } };
    case 'reset-password':
      return { screen: 'ResetPassword', params: { token: second } };
    case 'auth':
      return { screen: 'OAuthCallback', params: { token: parsed.queryParams?.token, error: parsed.queryParams?.error } };
    default:
      return null;
  }
}

/**
 * Generate shareable deep link URL
 */
export function generateDeepLink(
  type: 'post' | 'user' | 'room' | 'deal' | 'ama' | 'hashtag' | 'invite',
  id: string | number
): string {
  const baseUrl = `https://${UNIVERSAL_LINK_DOMAINS[0]}`;
  
  switch (type) {
    case 'post':
      return `${baseUrl}/post/${id}`;
    case 'user':
      return `${baseUrl}/user/${id}`;
    case 'room':
      return `${baseUrl}/room/${id}`;
    case 'deal':
      return `${baseUrl}/deal/${id}`;
    case 'ama':
      return `${baseUrl}/ama/${id}`;
    case 'hashtag':
      return `${baseUrl}/hashtag/${id}`;
    case 'invite':
      return `${baseUrl}/invite/${id}`;
    default:
      return baseUrl;
  }
}

/**
 * Generate app-specific deep link (for internal use)
 */
export function generateAppLink(
  type: 'post' | 'user' | 'room' | 'deal',
  id: string | number
): string {
  return `${SCHEME}://${type}/${id}`;
}

/**
 * Check if URL is a valid deep link
 */
export function isValidDeepLink(url: string): boolean {
  try {
    const parsed = Linking.parse(url);
    const isScheme = url.startsWith(`${SCHEME}://`);
    const isUniversal = UNIVERSAL_LINK_DOMAINS.some(domain => 
      url.includes(domain)
    );
    return isScheme || isUniversal;
  } catch {
    return false;
  }
}
