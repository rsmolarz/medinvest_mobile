import { useState, useEffect, useCallback, useRef } from 'react';
import { Keyboard } from 'react-native';

/**
 * Debounce hook - delays value updates
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounced callback hook
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Search state hook with debouncing
 */
export function useSearch(initialValue: string = '', delay: number = 400) {
  const [query, setQuery] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, delay);

  useEffect(() => {
    setIsSearching(query !== debouncedQuery);
  }, [query, debouncedQuery]);

  const clearSearch = useCallback(() => {
    setQuery('');
    Keyboard.dismiss();
  }, []);

  return {
    query,
    setQuery,
    debouncedQuery,
    isSearching,
    clearSearch,
    hasQuery: query.length > 0,
  };
}

/**
 * Infinite scroll hook for FlatList
 */
export function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: {
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}) {
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    onEndReached: handleEndReached,
    onEndReachedThreshold: 0.5,
  };
}

/**
 * Pull to refresh hook
 */
export function useRefresh(refetch: () => Promise<any>) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return {
    refreshing,
    onRefresh,
  };
}

/**
 * Combined list hook for infinite scroll with refresh
 */
export function useInfiniteList<T>({
  data,
  isLoading,
  isRefetching,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch,
}: {
  data?: { pages: { data: T[] }[] };
  isLoading: boolean;
  isRefetching: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => Promise<any>;
}) {
  // Flatten paginated data
  const flatData = data?.pages.flatMap((page) => page.data) ?? [];

  // Pull to refresh
  const { refreshing, onRefresh } = useRefresh(refetch);

  // Infinite scroll
  const { onEndReached, onEndReachedThreshold } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  return {
    data: flatData,
    isLoading,
    isRefetching,
    refreshing,
    onRefresh,
    onEndReached,
    onEndReachedThreshold,
    isFetchingNextPage,
    hasNextPage,
    isEmpty: !isLoading && flatData.length === 0,
  };
}

/**
 * Previous value hook
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Mounted state hook
 */
export function useMounted(): boolean {
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  return mounted.current;
}
