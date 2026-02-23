"use client";

import useSWR from "swr";
import { getNewsAction } from "@/actions/news-actions";
import type { News } from "@/db/schema";
import { NEWS_CACHE_KEY } from "@/constants/cache-keys";

/**
 * Custom hook for fetching news data with SWR
 * @param initialData - Optional initial data to use as fallback
 * @returns News data, loading state, error state, and mutate function
 */
export function useNews(initialData?: News[]) {
  // Use SWR with our server action as the fetcher
  const { data, error, isLoading, mutate } = useSWR<News[], Error>(
    NEWS_CACHE_KEY,
    async () => {
      const result = await getNewsAction();

      // Handle error from server action
      if ("error" in result) {
        throw new Error(result.error);
      }

      return result;
    },
    {
      // Use initial data as fallback
      fallbackData: initialData,
      // Configure SWR to revalidate on focus and reconnect
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      // Deduplicate requests within this window (in milliseconds)
      dedupingInterval: 5000,
      // Keep showing previous data while revalidating
      keepPreviousData: true,
    },
  );

  return {
    news: data || [],
    isLoading,
    error,
    mutate,
  };
}
