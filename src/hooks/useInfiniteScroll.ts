import { useEffect, useRef, useCallback, useState } from 'react';

interface UseInfiniteScrollOptions {
  /** Function to load next page. Should return true if there are more pages. */
  loadMore: () => Promise<boolean>;
  /** Whether a load is currently in progress */
  isLoading: boolean;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Root margin for intersection observer (default: '200px') */
  rootMargin?: string;
  /** Threshold for intersection (default: 0.1) */
  threshold?: number;
}

interface UseInfiniteScrollReturn {
  /** Ref to attach to the sentinel element at the bottom of the list */
  sentinelRef: React.RefCallback<HTMLElement>;
  /** Current page number */
  page: number;
  /** Reset pagination (e.g., when switching feeds) */
  reset: () => void;
}

export function useInfiniteScroll({
  loadMore,
  isLoading,
  hasMore,
  rootMargin = '200px',
  threshold = 0.1,
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  const [page, setPage] = useState(1);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(false);

  // Keep refs in sync to avoid stale closures in the observer callback
  const isLoadingRef = useRef(isLoading);
  const hasMoreRef = useRef(hasMore);
  const loadMoreRef = useRef(loadMore);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  const handleIntersect = useCallback(
    async (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (
        !entry?.isIntersecting ||
        isLoadingRef.current ||
        !hasMoreRef.current ||
        loadingRef.current
      ) {
        return;
      }

      loadingRef.current = true;
      try {
        const moreAvailable = await loadMoreRef.current();
        if (moreAvailable) {
          setPage((prev) => prev + 1);
        }
      } finally {
        loadingRef.current = false;
      }
    },
    [],
  );

  // Ref callback pattern: works with dynamic/conditional elements
  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      // Disconnect any previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node) return;

      observerRef.current = new IntersectionObserver(handleIntersect, {
        rootMargin,
        threshold,
      });
      observerRef.current.observe(node);
    },
    [handleIntersect, rootMargin, threshold],
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const reset = useCallback(() => {
    setPage(1);
    loadingRef.current = false;
  }, []);

  return { sentinelRef, page, reset };
}
