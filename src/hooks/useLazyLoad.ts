import { useState, useEffect, useRef, useCallback } from 'react';

interface UseLazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
}

export const useLazyLoad = <T>(
  items: T[],
  itemsPerPage: number = 20,
  options: UseLazyLoadOptions = {}
) => {
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const { threshold = 0.1, rootMargin = '100px' } = options;

  const loadMore = useCallback(() => {
    if (!hasMore) return;

    const currentLength = visibleItems.length;
    const nextItems = items.slice(0, currentLength + itemsPerPage);
    
    setVisibleItems(nextItems);
    setHasMore(nextItems.length < items.length);
  }, [items, visibleItems.length, itemsPerPage, hasMore]);

  useEffect(() => {
    // Initial load
    const initialItems = items.slice(0, itemsPerPage);
    setVisibleItems(initialItems);
    setHasMore(initialItems.length < items.length);
  }, [items, itemsPerPage]);

  useEffect(() => {
    // Set up intersection observer for infinite scroll
    if (!loadMoreRef.current || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold, rootMargin }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current && loadMoreRef.current) {
        observerRef.current.unobserve(loadMoreRef.current);
      }
    };
  }, [hasMore, loadMore, threshold, rootMargin]);

  return {
    visibleItems,
    hasMore,
    loadMoreRef,
    loadMore,
  };
};










