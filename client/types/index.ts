/**
 * MedInvest Type Definitions
 */

// =============================================================================
// USER TYPES
// =============================================================================

export interface User {
  id: number | string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone?: string;
  specialty?: string;
  bio?: string;
  avatar_url?: string;
  provider?: 'apple' | 'google' | 'mock' | 'email';
  is_verified?: boolean;
  is_accredited?: boolean;
  is_premium?: boolean;
  is_admin?: boolean;
  subscription_tier?: SubscriptionTier;
  points?: number;
  level?: number;
  login_streak?: number;
  referral_code?: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
}

export type SubscriptionTier = 'free' | 'premium';

export interface UserProfile extends User {
  posts: Post[];
  isFollowing: boolean;
  mutualFollowers: User[];
}

// =============================================================================
// POST TYPES
// =============================================================================

export interface Post {
  id: number;
  content: string;
  author: User;
  room: Room | null;
  images: string[];
  video_url?: string;
  is_anonymous: boolean;
  anonymous_name?: string;
  mentions: string[];
  hashtags: string[];
  upvotes: number;
  downvotes: number;
  comments_count: number;
  user_vote?: VoteDirection;
  is_bookmarked: boolean;
  feed_score: number;
  created_at: string;
  updated_at: string;
}

export interface Mention {
  user_id: number;
  username: string;
  start_index: number;
  end_index: number;
}

export type VoteDirection = 'up' | 'down' | null;

export interface Comment {
  id: number;
  content: string;
  author: User;
  post_id: number;
  parent_id?: number | null;
  upvotes: number;
  downvotes: number;
  user_vote?: VoteDirection;
  replies?: Comment[];
  replies_count: number;
  created_at: string;
}

export interface CreatePostData {
  content: string;
  room_id: number;
  is_anonymous?: boolean;
  images?: string[];
  video_url?: string;
}

// =============================================================================
// ROOM TYPES
// =============================================================================

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
  rules?: string[];
  moderators?: User[];
}

export const ROOM_CATEGORIES = [
  { slug: 'general', name: 'General Discussion', icon: '💬', color: '#6B7280' },
  { slug: 'biotech', name: 'Biotech', icon: '🧬', color: '#10B981' },
  { slug: 'medtech', name: 'MedTech', icon: '🏥', color: '#3B82F6' },
  { slug: 'pharma', name: 'Pharma', icon: '💊', color: '#8B5CF6' },
  { slug: 'digital-health', name: 'Digital Health', icon: '📱', color: '#EC4899' },
  { slug: 'diagnostics', name: 'Diagnostics', icon: '🔬', color: '#F59E0B' },
  { slug: 'genomics', name: 'Genomics', icon: '🧪', color: '#14B8A6' },
  { slug: 'medical-devices', name: 'Medical Devices', icon: '⚕️', color: '#EF4444' },
  { slug: 'healthcare-ai', name: 'Healthcare AI', icon: '🤖', color: '#6366F1' },
  { slug: 'clinical-trials', name: 'Clinical Trials', icon: '📋', color: '#84CC16' },
  { slug: 'regulatory', name: 'Regulatory & FDA', icon: '📜', color: '#F97316' },
  { slug: 'investment-strategies', name: 'Investment Strategies', icon: '📈', color: '#0EA5E9' },
  { slug: 'market-analysis', name: 'Market Analysis', icon: '📊', color: '#A855F7' },
  { slug: 'career', name: 'Career & Networking', icon: '🤝', color: '#22C55E' },
] as const;

// =============================================================================
// FEED TYPES
// =============================================================================

export type FeedStyle = 'algorithmic' | 'chronological' | 'discovery';

export interface FeedResponse {
  posts: Post[];
  has_more: boolean;
  next_cursor?: string;
  feed_style: FeedStyle;
}

export interface TrendingTopic {
  hashtag: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  change_percent?: number;
}

// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  data?: NotificationData;
  is_read: boolean;
  created_at: string;
}

export type NotificationType = 
  | 'like'
  | 'comment'
  | 'follow'
  | 'mention'
  | 'reply'
  | 'message'
  | 'ama_live'
  | 'deal_update'
  | 'achievement'
  | 'friend_request'
  | 'friend_accepted'
  | 'investment_update'
  | 'course_update'
  | 'event_reminder'
  | 'system';

export interface NotificationData {
  post_id?: number;
  user_id?: number;
  comment_id?: number;
  ama_id?: number;
  deal_id?: number;
  achievement_id?: number;
  course_id?: number;
  event_id?: number;
  investment_id?: number;
}

// =============================================================================
// MESSAGE TYPES
// =============================================================================

export interface Conversation {
  id: number;
  other_user: User;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  is_muted: boolean;
}

export interface Message {
  id: number;
  conversation_id: number;
  content: string;
  sender: User;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

// =============================================================================
// CONTENT TYPES
// =============================================================================

// AMA
export interface AMA {
  id: number;
  title: string;
  description: string;
  expert: User;
  expert_bio: string;
  status: AMAStatus;
  scheduled_at: string;
  ended_at?: string;
  questions_count: number;
  attendees_count: number;
  is_attending: boolean;
  questions?: AMAQuestion[];
}

export type AMAStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';

export interface AMAQuestion {
  id: number;
  question: string;
  author: User;
  answer?: string;
  upvotes: number;
  is_answered: boolean;
  created_at: string;
}

// Deals
export interface Deal {
  id: number;
  title: string;
  company?: string;
  company_name: string;
  company_logo?: string;
  image_url?: string;
  description: string;
  pitch_deck_url?: string;
  target_raise: number;
  raised: number;
  minimum_investment: number;
  maximum_investment?: number;
  valuation?: number;
  equity_offered?: number;
  status: DealStatus;
  deadline: string;
  category: string;
  stage?: string;
  highlights: string[];
  risks?: string[];
  team?: Array<{ name: string; role: string; background?: string }>;
  documents?: Array<{ name: string; url: string }>;
  investors_count: number;
  featured?: boolean;
  is_watched?: boolean;
  is_invested?: boolean;
  my_investment?: number;
  created_at?: string;
}

export type DealStatus = 'draft' | 'review' | 'active' | 'funded' | 'closed' | 'rejected';

// Courses
export interface Course {
  id: number;
  title: string;
  description: string;
  instructor: User;
  thumbnail_url?: string;
  duration_minutes: number;
  lessons_count: number;
  lessons?: Lesson[];
  is_premium: boolean;
  price?: number;
  rating: number;
  reviews_count: number;
  enrolled_count: number;
  is_enrolled: boolean;
  progress?: number;
  completed_lessons?: number[];
}

export interface Lesson {
  id: number;
  course_id: number;
  title: string;
  description: string;
  video_url?: string;
  content?: string;
  duration_minutes: number;
  order: number;
  is_completed: boolean;
}

// Events
export interface Event {
  id: number;
  title: string;
  description: string;
  event_type: EventType;
  starts_at: string;
  ends_at: string;
  location?: string;
  virtual_url?: string;
  is_virtual: boolean;
  organizer: User;
  thumbnail_url?: string;
  attendees_count: number;
  max_attendees?: number;
  is_attending: boolean;
  price?: number;
  is_free: boolean;
}

export type EventType = 'webinar' | 'conference' | 'meetup' | 'workshop' | 'networking';

// =============================================================================
// GAMIFICATION TYPES
// =============================================================================

export interface LeaderboardEntry {
  rank: number;
  user: User;
  points: number;
  change?: number;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  points: number;
  category: AchievementCategory;
  unlocked: boolean;
  unlocked_at?: string;
  progress?: number;
  target?: number;
}

export type AchievementCategory = 
  | 'posting'
  | 'engagement'
  | 'learning'
  | 'investing'
  | 'social'
  | 'streak';

export interface UserStats {
  points: number;
  level: number;
  rank: number;
  streak: number;
  posts_created: number;
  comments_made: number;
  upvotes_received: number;
  courses_completed: number;
  achievements_unlocked: number;
}

// =============================================================================
// SEARCH TYPES
// =============================================================================

export interface SearchResults {
  posts: Post[];
  users: User[];
  rooms: Room[];
  hashtags: TrendingTopic[];
  total_count: number;
}

export type SearchType = 'all' | 'posts' | 'users' | 'rooms' | 'hashtags';

// =============================================================================
// SUBSCRIPTION TYPES
// =============================================================================

export interface SubscriptionStatus {
  is_premium: boolean;
  tier: SubscriptionTier;
  expires_at?: string;
  will_renew: boolean;
  stripe_subscription_id?: string;
}

export interface PremiumFeatures {
  exclusive_content: boolean;
  deal_access: boolean;
  priority_support: boolean;
  advanced_analytics: boolean;
  ad_free: boolean;
  early_access: boolean;
}

// =============================================================================
// NAVIGATION TYPES
// =============================================================================

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
  PostDetail: { postId: number };
  CreatePost: { roomSlug?: string };
  EditPost: { postId: number };
  UserProfile: { userId: number };
  EditProfile: undefined;
  RoomDetail: { roomSlug: string };
  Conversation: { userId: number };
  NewConversation: undefined;
  VoiceCall: { recipientId: string; recipientName: string; recipientAvatar?: string; callType: 'audio' | 'video' };
  AMADetail: { amaId: number };
  DealDetail: { dealId: number };
  CourseDetail: { courseId: number };
  LessonDetail: { courseId: number; lessonId: number };
  LessonPlayer: { courseId: number; lessonId: number };
  EventDetail: { eventId: number };
  Settings: undefined;
  Notifications: undefined;
  Search: { query?: string; type?: SearchType };
  Hashtag: { tag: string };
  Followers: { userId: number; type: 'followers' | 'following' };
  Premium: undefined;
  Bookmarks: undefined;
  Leaderboard: undefined;
  Achievements: undefined;
  Drafts: undefined;
  AIChat: undefined;
  ChangePassword: undefined;
  BlockedUsers: undefined;
  DeleteAccount: undefined;
  BiometricSettings: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  AppearanceSettings: undefined;
  NotificationSettings: undefined;
  ContentPreferences: undefined;
  Report: { type: 'post' | 'user' | 'comment'; targetId: number };
  SavedSearches: undefined;
  DataExport: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Discover: undefined;
  Messages: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  VerifyEmail: { email: string };
};

// =============================================================================
// API/DATA TYPES
// =============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Investment {
  id: string;
  name: string;
  company: string;
  description: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  minInvestment: number;
  maxInvestment?: number;
  returnRate?: string;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'active' | 'funded' | 'closed';
  deadline?: string;
  imageUrl?: string;
  highlights: string[];
  documents?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface InvestmentFilters {
  category?: string;
  riskLevel?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export interface PortfolioInvestment {
  id: string;
  investmentId: string;
  investment: Investment;
  amount: number;
  shares?: number;
  purchaseDate: string;
  currentValue?: number;
  returnPercent?: number;
  status: 'active' | 'matured' | 'exited';
}

export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalReturn: number;
  returnPercent: number;
  investmentsCount: number;
  activeInvestments: number;
}

export interface Transaction {
  id: string;
  type: 'investment' | 'dividend' | 'withdrawal' | 'deposit';
  amount: number;
  description: string;
  investmentName?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  category: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  imageUrl?: string;
  readTime: number;
  isBookmarked: boolean;
  isPremium: boolean;
  publishedAt: string;
  tags?: string[];
}

export interface ArticleFilters {
  category?: string;
  isPremium?: boolean;
  search?: string;
}
