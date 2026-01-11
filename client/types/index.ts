// ============================================
// User Types
// ============================================

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatarUrl?: string;
  phone?: string;
  provider: 'apple' | 'google' | 'email';
  isVerified: boolean;
  isAccredited: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Investment Types
// ============================================

export interface Investment {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  category: InvestmentCategory;
  fundingGoal: number;
  fundingCurrent: number;
  minimumInvestment: number;
  expectedROI: string;
  daysRemaining: number;
  startDate: string;
  endDate: string;
  imageUrl?: string;
  riskLevel: RiskLevel;
  status: InvestmentStatus;
  investors: number;
  documents: InvestmentDocument[];
  team: TeamMember[];
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
}

export type InvestmentCategory =
  | 'Biotech'
  | 'Medical Devices'
  | 'Digital Health'
  | 'Pharmaceuticals'
  | 'Research'
  | 'Healthcare Services';

export type RiskLevel = 'Low' | 'Medium' | 'High';

export type InvestmentStatus = 'active' | 'funded' | 'closed' | 'cancelled';

export interface InvestmentDocument {
  id: string;
  name: string;
  type: string;
  url: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  linkedInUrl?: string;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  completed: boolean;
  completedAt?: string;
}

export interface InvestmentFilters {
  search?: string;
  category?: InvestmentCategory;
  riskLevel?: RiskLevel;
  status?: InvestmentStatus;
  minInvestment?: number;
  maxInvestment?: number;
  sortBy?: 'newest' | 'endingSoon' | 'mostFunded' | 'highestROI';
}

// ============================================
// Portfolio Types
// ============================================

export interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  totalGainLoss: number;
  gainLossPercent: number;
  activeInvestments: number;
  completedInvestments: number;
  pendingInvestments: number;
}

export interface PortfolioInvestment {
  id: string;
  investmentId: string;
  name: string;
  category: InvestmentCategory;
  amountInvested: number;
  currentValue: number;
  gainLossPercent: number;
  status: PortfolioInvestmentStatus;
  investedAt: string;
  imageUrl?: string;
}

export type PortfolioInvestmentStatus = 'active' | 'completed' | 'pending' | 'cancelled';

export interface Transaction {
  id: string;
  type: 'investment' | 'dividend' | 'withdrawal' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  investmentId?: string;
  investmentName?: string;
  createdAt: string;
  completedAt?: string;
}

// ============================================
// Article Types
// ============================================

export interface Article {
  id: string;
  title: string;
  summary: string;
  content?: string;
  source: string;
  sourceUrl?: string;
  author?: string;
  publishedAt: string;
  readTime: number;
  imageUrl?: string;
  category: ArticleCategory;
  tags: string[];
  isFeatured: boolean;
  isBookmarked: boolean;
  viewCount: number;
}

export type ArticleCategory =
  | 'AI & Healthcare'
  | 'Biotech'
  | 'Medical Devices'
  | 'Digital Health'
  | 'Market Trends'
  | 'Regulations'
  | 'Research';

export interface ArticleFilters {
  search?: string;
  category?: ArticleCategory;
  featured?: boolean;
  sortBy?: 'newest' | 'popular' | 'readTime';
}

// ============================================
// Payment Types
// ============================================

export interface PaymentMethod {
  id: string;
  type: 'bank' | 'card';
  name: string;
  last4: string;
  isDefault: boolean;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
}

// ============================================
// Notification Types
// ============================================

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export type NotificationType =
  | 'investment_update'
  | 'portfolio_milestone'
  | 'new_opportunity'
  | 'article'
  | 'system';

// ============================================
// API Response Types
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}
