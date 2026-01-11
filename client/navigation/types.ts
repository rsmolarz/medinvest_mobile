import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// ============================================
// Root Stack
// ============================================

export type RootStackParamList = {
  // Pre-auth
  Onboarding: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  
  // Main app
  Main: NavigatorScreenParams<MainTabParamList>;
  
  // Investment screens
  InvestmentDetail: { investmentId: string };
  InvestModal: { investmentId: string; investmentName: string; minimumInvestment: number };
  
  // Article screens
  ArticleDetail: { articleId: string };
  BookmarkedArticles: undefined;
  
  // Portfolio screens
  TransactionHistory: undefined;
  
  // Settings screens
  Settings: undefined;
  EditProfile: undefined;
  NotificationsSettings: undefined;
  Documents: undefined;
  PaymentMethods: undefined;
  Support: undefined;
  Legal: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;

// ============================================
// Auth Stack
// ============================================

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  VerifyEmail: { email: string };
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = 
  NativeStackScreenProps<AuthStackParamList, T>;

// ============================================
// Main Tab Navigator
// ============================================

export type MainTabParamList = {
  Discover: NavigatorScreenParams<DiscoverStackParamList>;
  Portfolio: NavigatorScreenParams<PortfolioStackParamList>;
  Research: NavigatorScreenParams<ResearchStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type MainTabScreenProps<T extends keyof MainTabParamList> = 
  BottomTabScreenProps<MainTabParamList, T>;

// ============================================
// Discover Stack
// ============================================

export type DiscoverStackParamList = {
  DiscoverHome: undefined;
  Category: { category: string };
  Search: { query?: string };
};

export type DiscoverStackScreenProps<T extends keyof DiscoverStackParamList> = 
  NativeStackScreenProps<DiscoverStackParamList, T>;

// ============================================
// Portfolio Stack
// ============================================

export type PortfolioStackParamList = {
  PortfolioHome: undefined;
  PortfolioDetail: { investmentId: string };
};

export type PortfolioStackScreenProps<T extends keyof PortfolioStackParamList> = 
  NativeStackScreenProps<PortfolioStackParamList, T>;

// ============================================
// Research Stack
// ============================================

export type ResearchStackParamList = {
  ResearchHome: undefined;
  ArticleCategory: { category: string };
};

export type ResearchStackScreenProps<T extends keyof ResearchStackParamList> = 
  NativeStackScreenProps<ResearchStackParamList, T>;

// ============================================
// Profile Stack
// ============================================

export type ProfileStackParamList = {
  ProfileHome: undefined;
};

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> = 
  NativeStackScreenProps<ProfileStackParamList, T>;

// ============================================
// Screen Params Helpers
// ============================================

export interface InvestmentParams {
  investmentId: string;
}

export interface ArticleParams {
  articleId: string;
}

export interface InvestModalParams {
  investmentId: string;
  investmentName: string;
  minimumInvestment: number;
}

// ============================================
// Global Type Declaration
// ============================================

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
