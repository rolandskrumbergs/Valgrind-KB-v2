"use client";

import useSWR from "swr";
import { getLicensesAction } from "@/actions/license-actions";
import type { LicenseWithUser } from "@/db/schema";
import { LICENSES_CACHE_KEY } from "@/constants/cache-keys";

/**
 * Custom hook for fetching customer users data with SWR
 * @returns Customer users data, loading state, error state, and mutate function
 */
export function useLicense(customerId: string) {
	// Use SWR with our server action as the fetcher
	const { data, error, isLoading, mutate } = useSWR<LicenseWithUser[], Error>(
		`${LICENSES_CACHE_KEY}-${customerId}`,
		async () => {
			const result = await getLicensesAction(customerId);

			// Handle error from server action
			if ("error" in result) {
				throw new Error(result.error as string);
			}

			return result;
		},
		{
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
		licenses: data || [],
		isLoading,
		error,
		mutate,
	};
}
