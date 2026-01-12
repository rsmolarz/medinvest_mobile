/**
 * MedInvest API Client
 * Connects to the Flask backend REST API
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api/v1'
  : 'https://your-production-url.com/api/v1';

// Token storage keys
const ACCESS_TOKEN_KEY = 'medinvest_access_token';
const REFRESH_TOKEN_KEY = 'medinvest_refresh_token';

// Types
export interface ApiError {
  error: string;
  message?: string;
  status?: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

// Token management
class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async getAccessToken(): Promise<string | null> {
    if (this.accessToken) return this.accessToken;
    
    if (Platform.OS === 'web') {
      this.accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    } else {
      this.accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    }
    return this.accessToken;
  }

  async getRefreshToken(): Promise<string | null> {
    if (this.refreshToken) return this.refreshToken;
    
    if (Platform.OS === 'web') {
      this.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    } else {
      this.refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    }
    return this.refreshToken;
  }

  async setTokens(access: string, refresh: string): Promise<void> {
    this.accessToken = access;
    this.refreshToken = refresh;
    
    if (Platform.OS === 'web') {
      localStorage.setItem(ACCESS_TOKEN_KEY, access);
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    } else {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh);
    }
  }

  async clearTokens(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
    
    if (Platform.OS === 'web') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
  }
}

export const tokenManager = new TokenManager();

// API Client
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const accessToken = await tokenManager.getAccessToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle token refresh on 401
      if (response.status === 401 && !endpoint.includes('/auth/')) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the request with new token
          const newAccessToken = await tokenManager.getAccessToken();
          (headers as Record<string, string>)['Authorization'] = `Bearer ${newAccessToken}`;
          const retryResponse = await fetch(url, { ...options, headers });
          return this.handleResponse<T>(retryResponse);
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: {
          error: 'network_error',
          message: error instanceof Error ? error.message : 'Network request failed',
        },
      };
    }
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: {
            error: data.error || 'request_failed',
            message: data.message || `Request failed with status ${response.status}`,
            status: response.status,
          },
        };
      }

      return {
        success: true,
        data,
      };
    } catch {
      return {
        success: false,
        error: {
          error: 'parse_error',
          message: 'Failed to parse response',
          status: response.status,
        },
      };
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    const refreshToken = await tokenManager.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        await tokenManager.setTokens(data.access_token, data.refresh_token);
        return true;
      }
    } catch {
      // Refresh failed
    }

    await tokenManager.clearTokens();
    return false;
  }

  // HTTP methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // File upload
  async upload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const accessToken = await tokenManager.getAccessToken();

    const headers: HeadersInit = {};
    if (accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: {
          error: 'upload_error',
          message: error instanceof Error ? error.message : 'Upload failed',
        },
      };
    }
  }
}

export const api = new ApiClient(API_BASE_URL);

// =============================================================================
// AUTH API
// =============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  specialty?: string;
  referral_code?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  specialty?: string;
  bio?: string;
  avatar_url?: string;
  is_verified: boolean;
  is_premium: boolean;
  subscription_tier: 'free' | 'premium';
  points: number;
  level: number;
  login_streak: number;
  referral_code: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: string;
}

export const authApi = {
  login: async (data: LoginRequest) => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    if (response.success && response.data) {
      await tokenManager.setTokens(
        response.data.access_token,
        response.data.refresh_token
      );
    }
    return response;
  },

  register: async (data: RegisterRequest) => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    if (response.success && response.data) {
      await tokenManager.setTokens(
        response.data.access_token,
        response.data.refresh_token
      );
    }
    return response;
  },

  logout: async () => {
    await tokenManager.clearTokens();
    return { success: true };
  },

  getCurrentUser: () => api.get<User>('/auth/me'),

  forgotPassword: (email: string) => 
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),

  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post('/auth/change-password', data),

  verifyEmail: (token: string) =>
    api.post(`/auth/verify-email/${token}`),

  resendVerification: () =>
    api.post('/auth/resend-verification'),
    
  resendVerificationEmail: (email: string) =>
    api.post('/auth/resend-verification', { email }),
    
  deleteAccount: (data: { reason: string; other_reason?: string; password: string }) =>
    api.post('/auth/delete-account', data),
    
  deactivateAccount: () =>
    api.post('/auth/deactivate'),
};

// =============================================================================
// FEED API
// =============================================================================

export interface Post {
  id: number;
  content: string;
  author: User;
  room: Room;
  images: string[];
  video_url?: string;
  is_anonymous: boolean;
  mentions: string[];
  hashtags: string[];
  upvotes: number;
  downvotes: number;
  comments_count: number;
  user_vote?: 'up' | 'down' | null;
  is_bookmarked: boolean;
  feed_score: number;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  posts_count: number;
  members_count: number;
  is_member: boolean;
}

export interface FeedResponse {
  posts: Post[];
  has_more: boolean;
  next_cursor?: string;
  feed_style: 'algorithmic' | 'chronological' | 'discovery';
}

export interface TrendingTopic {
  hashtag: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
}

export const feedApi = {
  getFeed: (cursor?: string, style?: string) => {
    let endpoint = '/feed';
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    if (style) params.append('style', style);
    if (params.toString()) endpoint += `?${params.toString()}`;
    return api.get<FeedResponse>(endpoint);
  },

  getTrending: () => api.get<{ topics: TrendingTopic[] }>('/feed/trending'),

  getRoomFeed: (roomSlug: string, cursor?: string) => {
    let endpoint = `/rooms/${roomSlug}/posts`;
    if (cursor) endpoint += `?cursor=${cursor}`;
    return api.get<FeedResponse>(endpoint);
  },
};

// =============================================================================
// POSTS API
// =============================================================================

export interface CreatePostRequest {
  content: string;
  room_id: number;
  is_anonymous?: boolean;
  images?: string[];
  video?: string; // Local video URI for upload
  video_url?: string; // Remote video URL
}

export interface Comment {
  id: number;
  content: string;
  author: User;
  post_id: number;
  parent_id?: number;
  upvotes: number;
  downvotes: number;
  user_vote?: 'up' | 'down' | null;
  replies_count: number;
  created_at: string;
}

export const postsApi = {
  getPost: (id: number) => api.get<Post>(`/posts/${id}`),

  createPost: (data: CreatePostRequest) => api.post<Post>('/posts', data),

  updatePost: (id: number, content: string) =>
    api.put<Post>(`/posts/${id}`, { content }),

  deletePost: (id: number) => api.delete(`/posts/${id}`),

  vote: (id: number, direction: 'up' | 'down') =>
    api.post<{ upvotes: number; downvotes: number }>(`/posts/${id}/vote`, { direction }),

  removeVote: (id: number) => api.delete(`/posts/${id}/vote`),

  bookmark: (id: number) => api.post(`/posts/${id}/bookmark`),

  removeBookmark: (id: number) => api.delete(`/posts/${id}/bookmark`),

  getComments: (postId: number) =>
    api.get<{ comments: Comment[] }>(`/posts/${postId}/comments`),

  addComment: (postId: number, content: string, parentId?: number) =>
    api.post<Comment>(`/posts/${postId}/comments`, { content, parent_id: parentId }),

  deleteComment: (postId: number, commentId: number) =>
    api.delete(`/posts/${postId}/comments/${commentId}`),

  uploadMedia: (formData: FormData) =>
    api.upload<{ urls: string[] }>('/posts/upload', formData),
};

// =============================================================================
// ROOMS API
// =============================================================================

export const roomsApi = {
  getRooms: () => api.get<{ rooms: Room[] }>('/rooms'),

  getRoom: (slug: string) => api.get<Room>(`/rooms/${slug}`),

  joinRoom: (slug: string) => api.post(`/rooms/${slug}/join`),

  leaveRoom: (slug: string) => api.delete(`/rooms/${slug}/join`),
};

// =============================================================================
// USERS API
// =============================================================================

export interface UserProfile extends User {
  posts: Post[];
  is_following: boolean;
}

export const usersApi = {
  getProfile: (id: number) => api.get<UserProfile>(`/users/${id}`),
  
  getUser: (id: number) => api.get<UserProfile>(`/users/${id}`),

  updateProfile: (data: Partial<User>) => api.put<User>('/users/me', data),

  uploadAvatar: (formData: FormData) =>
    api.upload<{ avatar_url: string }>('/users/me/avatar', formData),

  follow: (id: number) => api.post(`/users/${id}/follow`),

  unfollow: (id: number) => api.delete(`/users/${id}/follow`),

  getFollowers: (id: number) => api.get<{ users: User[] }>(`/users/${id}/followers`),

  getFollowing: (id: number) => api.get<{ users: User[] }>(`/users/${id}/following`),

  search: (query: string) => api.get<{ users: User[] }>(`/users/search?q=${encodeURIComponent(query)}`),

  getBookmarks: () => api.get<{ posts: Post[] }>('/users/me/bookmarks'),
  
  // Block/Unblock
  block: (id: number) => api.post(`/users/${id}/block`),
  
  unblock: (id: number) => api.delete(`/users/${id}/block`),
  
  blockUser: (id: number) => api.post(`/users/${id}/block`),
  
  unblockUser: (id: number) => api.delete(`/users/${id}/block`),
  
  getBlockedUsers: () => api.get<{ blocked_users: Array<{ id: number; user: User; blocked_at: string }> }>('/users/me/blocked'),
  
  // User Posts
  getUserPosts: (id: number) => api.get<{ posts: Post[] }>(`/users/${id}/posts`),
  
  getUserComments: (id: number) => api.get<{ posts: Post[] }>(`/users/${id}/comments`),
  
  getUserLikes: (id: number) => api.get<{ posts: Post[] }>(`/users/${id}/likes`),
  
  // Suggested Users (People You May Know)
  getSuggestedUsers: (limit: number = 6) => 
    api.get<{ users: Array<{
      id: number;
      first_name: string;
      last_name: string;
      full_name: string;
      avatar_url?: string;
      specialty?: string;
      location?: string;
      mutual_connections?: number;
      reason?: string;
    }> }>(`/users/suggestions?limit=${limit}`),
};

// =============================================================================
// NEWS API
// =============================================================================

export interface NewsArticle {
  id: number;
  title: string;
  source: string;
  source_icon?: string;
  url: string;
  published_at: string;
  category?: string;
  image_url?: string;
}

export const newsApi = {
  getLatestNews: (limit: number = 10) => 
    api.get<{ articles: NewsArticle[] }>(`/news?limit=${limit}`),
  
  getNewsByCategory: (category: string, limit: number = 10) =>
    api.get<{ articles: NewsArticle[] }>(`/news?category=${category}&limit=${limit}`),
  
  getFeaturedNews: () =>
    api.get<{ articles: NewsArticle[] }>('/news/featured'),
};

// =============================================================================
// NOTIFICATIONS API
// =============================================================================

export interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export const notificationsApi = {
  getNotifications: (page?: number) => {
    let endpoint = '/notifications';
    if (page) endpoint += `?page=${page}`;
    return api.get<{ notifications: Notification[]; unread_count: number }>(endpoint);
  },

  markAsRead: (id: number) => api.post(`/notifications/${id}/read`),

  markAllAsRead: () => api.post('/notifications/read-all'),

  getUnreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),

  registerPushToken: (data: { token: string; platform: string; deviceId?: string }) =>
    api.post('/notifications/push-token', data),

  unregisterPushToken: (token: string) =>
    api.delete(`/notifications/push-token/${token}`),

  updatePreferences: (preferences: {
    push_enabled?: boolean;
    email_enabled?: boolean;
    likes?: boolean;
    comments?: boolean;
    follows?: boolean;
    mentions?: boolean;
    messages?: boolean;
    deals?: boolean;
    amas?: boolean;
  }) => api.put('/notifications/preferences', preferences),

  getPreferences: () =>
    api.get<{
      push_enabled: boolean;
      email_enabled: boolean;
      likes: boolean;
      comments: boolean;
      follows: boolean;
      mentions: boolean;
      messages: boolean;
      deals: boolean;
      amas: boolean;
    }>('/notifications/preferences'),
};

// =============================================================================
// MESSAGES API
// =============================================================================

export interface Conversation {
  id: number;
  other_user: User;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
}

export interface Message {
  id: number;
  content: string;
  sender: User;
  is_read: boolean;
  created_at: string;
}

export const messagesApi = {
  getConversations: () =>
    api.get<{ conversations: Conversation[] }>('/messages'),

  getConversation: (userId: number) =>
    api.get<{ messages: Message[]; other_user: User }>(`/messages/${userId}`),

  sendMessage: (userId: number, content: string) =>
    api.post<Message>(`/messages/${userId}`, { content }),

  deleteConversation: (userId: number) =>
    api.delete(`/messages/${userId}`),

  getUnreadCount: () =>
    api.get<{ count: number }>('/messages/unread-count'),
};

// =============================================================================
// SUBSCRIPTION API
// =============================================================================

export interface SubscriptionStatus {
  is_premium: boolean;
  tier: 'free' | 'premium';
  expires_at?: string;
}

export const subscriptionApi = {
  getStatus: () => api.get<SubscriptionStatus>('/stripe/subscription'),

  createCheckoutSession: () =>
    api.post<{ checkout_url: string }>('/stripe/create-checkout'),

  getPortalUrl: () =>
    api.get<{ portal_url: string }>('/stripe/portal'),
};

// =============================================================================
// CONTENT API (AMAs, Deals, Courses, etc.)
// =============================================================================

export interface AMA {
  id: number;
  title: string;
  description: string;
  expert: User;
  status: 'scheduled' | 'live' | 'ended';
  scheduled_at: string;
  questions_count: number;
}


export interface Course {
  id: number;
  title: string;
  description: string;
  instructor: User;
  duration_minutes: number;
  lessons_count: number;
  is_premium: boolean;
  progress?: number;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  event_type: 'webinar' | 'conference' | 'meetup';
  starts_at: string;
  ends_at: string;
  location?: string;
  is_virtual: boolean;
  attendees_count: number;
  is_attending: boolean;
}

export const contentApi = {
  // AMAs
  getAMAs: () => api.get<{ amas: AMA[] }>('/amas'),
  getAMA: (id: number) => api.get<AMA>(`/amas/${id}`),
  askQuestion: (amaId: number, question: string) =>
    api.post(`/amas/${amaId}/questions`, { question }),

  // Deals
  getDeals: (category?: string) => {
    let endpoint = '/deals';
    if (category) endpoint += `?category=${category}`;
    return api.get<{ deals: Deal[] }>(endpoint);
  },
  getDeal: (id: number) => api.get<Deal>(`/deals/${id}`),

  // Courses
  getCourses: () => api.get<{ courses: Course[] }>('/courses'),
  getCourse: (id: number) => api.get<Course>(`/courses/${id}`),
  enrollCourse: (id: number) => api.post(`/courses/${id}/enroll`),

  // Events
  getEvents: () => api.get<{ events: Event[] }>('/events'),
  getEvent: (id: number) => api.get<Event>(`/events/${id}`),
  attendEvent: (id: number) => api.post(`/events/${id}/attend`),
  unattendEvent: (id: number) => api.delete(`/events/${id}/attend`),
};

// =============================================================================
// COURSES API (with lessons)
// =============================================================================

export const coursesApi = {
  getCourses: () => api.get<{ courses: Course[] }>('/courses'),
  getCourse: (id: number) => api.get<Course>(`/courses/${id}`),
  enrollCourse: (id: number) => api.post(`/courses/${id}/enroll`),
  getCourseLessons: (courseId: number) => 
    api.get<{ lessons: any[] }>(`/courses/${courseId}/lessons`),
  getLesson: (courseId: number, lessonId: number) =>
    api.get<any>(`/courses/${courseId}/lessons/${lessonId}`),
  completeLesson: (courseId: number, lessonId: number) =>
    api.post(`/courses/${courseId}/lessons/${lessonId}/complete`),
};

// =============================================================================
// MODERATION API
// =============================================================================

export const moderationApi = {
  report: (data: {
    type: 'post' | 'comment' | 'user' | 'message';
    targetId: number;
    reason: string;
    details?: string;
  }) => api.post('/reports', {
    type: data.type,
    target_id: data.targetId,
    reason: data.reason,
    details: data.details,
  }),
};

// =============================================================================
// SEARCH API
// =============================================================================

export interface SearchResults {
  posts: Post[];
  users: User[];
  rooms: Room[];
  hashtags: TrendingTopic[];
}

export const searchApi = {
  search: (query: string, type?: 'all' | 'posts' | 'users' | 'rooms' | 'hashtags') => {
    let endpoint = `/search?q=${encodeURIComponent(query)}`;
    if (type && type !== 'all') endpoint += `&type=${type}`;
    return api.get<SearchResults>(endpoint);
  },

  autocomplete: (query: string, type: 'users' | 'hashtags') =>
    api.get<{ suggestions: string[] }>(`/search/autocomplete?q=${encodeURIComponent(query)}&type=${type}`),
};

// =============================================================================
// GAMIFICATION API
// =============================================================================

export interface LeaderboardEntry {
  rank: number;
  user: User;
  points: number;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  unlocked_at?: string;
}

export const gamificationApi = {
  getLeaderboard: (period?: 'weekly' | 'monthly' | 'all_time') => {
    let endpoint = '/leaderboard';
    if (period) endpoint += `?period=${period}`;
    return api.get<{ leaderboard: LeaderboardEntry[] }>(endpoint);
  },

  getAchievements: () =>
    api.get<{ achievements: Achievement[] }>('/achievements'),

  getMyStats: () =>
    api.get<{ points: number; level: number; rank: number; streak: number }>('/gamification/stats'),
};

// =============================================================================
// AI CHAT API
// =============================================================================

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const aiApi = {
  chat: (message: string, history?: ChatMessage[]) =>
    api.post<{ response: string; tokens_used: number }>('/ai/chat', {
      message,
      history: history?.slice(-10), // Last 10 messages for context
    }),

  streamChat: (message: string, history?: ChatMessage[]) =>
    api.post<{ stream_url: string }>('/ai/chat/stream', {
      message,
      history: history?.slice(-10),
    }),

  getSuggestions: (context: string) =>
    api.post<{ suggestions: string[] }>('/ai/suggestions', { context }),
};

// =============================================================================
// DEALS API
// =============================================================================

export interface Deal {
  id: number;
  company_name: string;
  company_logo?: string;
  category: string;
  description: string;
  highlights: string[];
  status: 'open' | 'closing_soon' | 'funded' | 'closed';
  funding_goal: number;
  raised_amount: number;
  min_investment: number;
  investors_count: number;
  closing_date?: string;
  investment_url?: string;
  team?: Array<{
    name: string;
    role: string;
    avatar_url?: string;
  }>;
  documents?: Array<{
    name: string;
    type: string;
    url: string;
  }>;
  created_at: string;
}

export const dealsApi = {
  getDeals: (category?: string, status?: string) => {
    let endpoint = '/deals';
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    const query = params.toString();
    if (query) endpoint += `?${query}`;
    return api.get<{ deals: Deal[]; stats: { active_count: number; total_raised: number } }>(endpoint);
  },

  getDeal: (id: number) => api.get<Deal>(`/deals/${id}`),

  expressInterest: (id: number, amount: number) =>
    api.post(`/deals/${id}/interest`, { amount }),
};


export default api;
