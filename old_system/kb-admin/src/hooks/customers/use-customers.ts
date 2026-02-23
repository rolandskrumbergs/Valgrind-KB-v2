"use client";

import useSWR from "swr";
import { getCustomersAction } from "@/actions/customer-actions";
import type { Customer } from "@/db/schema";
import { CUSTOMERS_CACHE_KEY } from "@/constants/cache-keys";

/**
 * Custom hook for fetching customers data with SWR
 * @param initialData - Optional initial data to use as fallback
 * @returns Customer data, loading state, error state, and mutate function
 */
export function useCustomers(initialData?: Customer[]) {
  // Use SWR with our server action as the fetcher
  const { data, error, isLoading, mutate } = useSWR<Customer[], Error>(
    CUSTOMERS_CACHE_KEY,
    async () => {
      const result = await getCustomersAction();

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
    customers: data || [],
    isLoading,
    error,
    mutate,
  };
}
