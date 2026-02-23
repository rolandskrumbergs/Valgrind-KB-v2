"use client";

import useSWR from "swr";
import { getLicenseUsageStatsAction } from "@/actions/customer-actions";
import { CUSTOMERS_CACHE_KEY } from "@/constants/cache-keys";

interface CustomerStats {
  totalCustomers: number;
  totalLicenses: number;
  usedLicenses: number;
  availableLicenses: number;
}

/**
 * Custom hook for fetching customer statistics with SWR
 * @param initialData - Optional initial data to use as fallback
 * @returns Customer statistics, loading state, and error state
 */
export function useCustomerStats(initialData?: CustomerStats) {
  // Use SWR with our server action as the fetcher
  const { data, error, isLoading, mutate } = useSWR<CustomerStats, Error>(
    `${CUSTOMERS_CACHE_KEY}/stats`,
    async () => {
      const result = await getLicenseUsageStatsAction();

      // Handle error from server action
      if ("error" in result) {
        throw new Error(result.error);
      }

      return {
        totalCustomers: result.totalCustomers,
        totalLicenses: result.totalLicenses,
        usedLicenses: result.usedLicenses,
        availableLicenses: result.availableLicenses,
      };
    },
    {
      // Use initial data as fallback
      fallbackData: initialData,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5000,
      keepPreviousData: true,
    },
  );

  return {
    stats: data || {
      totalCustomers: 0,
      totalLicenses: 0,
      usedLicenses: 0,
      availableLicenses: 0,
    },
    isLoading,
    error,
    mutate,
  };
}
