import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { apiClient } from './client';
import type {
  Investment,
  PortfolioInvestment,
  PortfolioSummary,
  Article,
  User,
  Transaction,
  PaginatedResponse,
  InvestmentFilters,
  ArticleFilters,
} from '@/types';

// ============================================
// Query Keys
// ============================================

export const queryKeys = {
  // Investments
  investments: ['investments'] as const,
  investmentsList: (filters?: InvestmentFilters) => 
    [...queryKeys.investments, 'list', filters] as const,
  investmentDetail: (id: string) => 
    [...queryKeys.investments, 'detail', id] as const,
  
  // Portfolio
  portfolio: ['portfolio'] as const,
  portfolioSummary: () => [...queryKeys.portfolio, 'summary'] as const,
  portfolioInvestments: () => [...queryKeys.portfolio, 'investments'] as const,
  transactions: (type?: string) => [...queryKeys.portfolio, 'transactions', type] as const,
  
  // Articles
  articles: ['articles'] as const,
  articlesList: (filters?: ArticleFilters) => 
    [...queryKeys.articles, 'list', filters] as const,
  articleDetail: (id: string) => 
    [...queryKeys.articles, 'detail', id] as const,
  bookmarkedArticles: () => [...queryKeys.articles, 'bookmarked'] as const,
  
  // User
  user: ['user'] as const,
  userProfile: () => [...queryKeys.user, 'profile'] as const,
};

// ============================================
// Investment Hooks
// ============================================

/**
 * Fetch investments with infinite scroll pagination
 */
export function useInvestments(filters?: InvestmentFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.investmentsList(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<PaginatedResponse<Investment>>(
        '/investments',
        {
          params: {
            page: pageParam,
            limit: 10,
            ...filters,
          },
        }
      );
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}

/**
 * Fetch single investment detail
 */
export function useInvestmentDetail(
  id: string,
  options?: Omit<UseQueryOptions<Investment>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.investmentDetail(id),
    queryFn: async () => {
      const response = await apiClient.get<Investment>(`/investments/${id}`);
      return response.data;
    },
    enabled: !!id,
    ...options,
  });
}

/**
 * Search investments with debounced query
 */
export function useSearchInvestments(
  query: string,
  filters?: Omit<InvestmentFilters, 'search'>
) {
  return useInfiniteQuery({
    queryKey: queryKeys.investmentsList({ search: query, ...filters }),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<PaginatedResponse<Investment>>(
        '/investments/search',
        {
          params: {
            q: query,
            page: pageParam,
            limit: 10,
            ...filters,
          },
        }
      );
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: query.length >= 2,
  });
}

// ============================================
// Portfolio Hooks
// ============================================

/**
 * Fetch portfolio summary
 */
export function usePortfolioSummary() {
  return useQuery({
    queryKey: queryKeys.portfolioSummary(),
    queryFn: async () => {
      const response = await apiClient.get<PortfolioSummary>('/portfolio/summary');
      return response.data;
    },
  });
}

/**
 * Fetch portfolio investments with pagination
 */
export function usePortfolioInvestments() {
  return useInfiniteQuery({
    queryKey: queryKeys.portfolioInvestments(),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<PaginatedResponse<PortfolioInvestment>>(
        '/portfolio/investments',
        {
          params: {
            page: pageParam,
            limit: 20,
          },
        }
      );
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}

/**
 * Create new investment
 */
export function useCreateInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      investmentId: string;
      amount: number;
      paymentMethodId: string;
    }) => {
      const response = await apiClient.post('/portfolio/invest', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate portfolio queries
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio });
      // Invalidate investment detail to update funding progress
      queryClient.invalidateQueries({ queryKey: queryKeys.investments });
    },
  });
}

/**
 * Fetch transaction history with infinite scroll
 */
export function useTransactions(type?: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.transactions(type),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<PaginatedResponse<Transaction>>(
        '/portfolio/transactions',
        {
          params: {
            page: pageParam,
            limit: 20,
            ...(type ? { type } : {}),
          },
        }
      );
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}

// ============================================
// Article Hooks
// ============================================

/**
 * Fetch articles with infinite scroll
 */
export function useArticles(filters?: ArticleFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.articlesList(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<PaginatedResponse<Article>>(
        '/articles',
        {
          params: {
            page: pageParam,
            limit: 15,
            ...filters,
          },
        }
      );
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}

/**
 * Fetch single article detail
 */
export function useArticleDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.articleDetail(id),
    queryFn: async () => {
      const response = await apiClient.get<Article>(`/articles/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Fetch bookmarked articles
 */
export function useBookmarkedArticles() {
  return useInfiniteQuery({
    queryKey: queryKeys.bookmarkedArticles(),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<PaginatedResponse<Article>>(
        '/articles/bookmarked',
        {
          params: {
            page: pageParam,
            limit: 15,
          },
        }
      );
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}

/**
 * Toggle article bookmark
 */
export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (articleId: string) => {
      const response = await apiClient.post(`/articles/${articleId}/bookmark`);
      return response.data;
    },
    onMutate: async (articleId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.articles });

      // Snapshot previous value
      const previousArticles = queryClient.getQueriesData({
        queryKey: queryKeys.articles,
      });

      // Optimistically update
      queryClient.setQueriesData(
        { queryKey: queryKeys.articles },
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data.map((article: Article) =>
                article.id === articleId
                  ? { ...article, isBookmarked: !article.isBookmarked }
                  : article
              ),
            })),
          };
        }
      );

      return { previousArticles };
    },
    onError: (_err, _articleId, context) => {
      // Rollback on error
      if (context?.previousArticles) {
        context.previousArticles.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarkedArticles() });
    },
  });
}

// ============================================
// User Hooks
// ============================================

/**
 * Fetch user profile
 */
export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.userProfile(),
    queryFn: async () => {
      const response = await apiClient.get<User>('/users/me');
      return response.data;
    },
  });
}

/**
 * Update user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<User>) => {
      const response = await apiClient.patch('/users/me', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.userProfile(), data);
    },
  });
}

/**
 * Upload avatar
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imageUri: string) => {
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);

      const response = await apiClient.post('/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile() });
    },
  });
}
