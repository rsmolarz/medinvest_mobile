// Network Provider (Offline Detection)
export {
  NetworkProvider,
  useNetwork,
  useIsOnline,
  OfflineAware,
} from './NetworkProvider';
export { default as NetworkProviderDefault } from './NetworkProvider';

// Query Provider (React Query)
export {
  QueryProvider,
  queryClient,
  queryKeys,
  prefetchInvestment,
  invalidateInvestments,
  invalidatePortfolio,
  clearQueryCache,
  isOnline,
} from './QueryProvider';
export { default as QueryProviderDefault } from './QueryProvider';
