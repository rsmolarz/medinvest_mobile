import type { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Root Stack Navigator Params
 */
export type RootStackParamList = {
  // Onboarding
  Onboarding: undefined;
  
  // Auth screens
  Auth: NavigatorScreenParams<AuthStackParamList>;
  
  // Main app screens
  Main: NavigatorScreenParams<MainTabParamList>;
  
  // Modal screens
  InvestModal: { investmentId?: string } | undefined;
  InvestmentDetail: { investmentId: string };
  
  // Other screens
  Settings: undefined;
  Documents: undefined;
  PaymentMethods: undefined;
  Support: undefined;
  Legal: undefined;
  EditProfile: undefined;
  NotificationsSettings: undefined;
  BookmarkedArticles: undefined;
  TransactionHistory: { investmentId?: string } | undefined;
  ArticleDetail: { articleId: string };
};

/**
 * Auth Stack Navigator Params
 */
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  VerifyEmail: { email: string };
};

/**
 * Main Tab Navigator Params
 */
export type MainTabParamList = {
  Discover: undefined;
  Portfolio: undefined;
  Research: undefined;
  Profile: undefined;
};

/**
 * Discover Stack Params (nested in Discover tab)
 */
export type DiscoverStackParamList = {
  DiscoverHome: undefined;
  InvestmentDetail: { investmentId: string };
  CategoryList: { categoryId: string; categoryName: string };
  SearchResults: { query: string };
};

/**
 * Portfolio Stack Params (nested in Portfolio tab)
 */
export type PortfolioStackParamList = {
  PortfolioHome: undefined;
  InvestmentDetail: { investmentId: string };
  TransactionHistory: { investmentId?: string };
};

/**
 * Research Stack Params (nested in Research tab)
 */
export type ResearchStackParamList = {
  ResearchHome: undefined;
  ArticleDetail: { articleId: string };
  SavedArticles: undefined;
};

/**
 * Profile Stack Params (nested in Profile tab)
 */
export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  Notifications: undefined;
};

/**
 * Investment data for navigation
 */
export interface InvestmentParams {
  investmentId: string;
  name?: string;
  imageUrl?: string;
}

/**
 * Article data for navigation
 */
export interface ArticleParams {
  articleId: string;
  title?: string;
  imageUrl?: string;
}

// Declare global types for useNavigation and useRoute
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
