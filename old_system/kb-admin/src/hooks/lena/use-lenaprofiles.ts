"use client";

import useSWR from "swr";
import { getAllLenaProfilesAction } from "@/actions/chat-actions";
import type { LenaProfiles } from "@/db/schema";
import { LENA_PROFILES_CACHE_KEY } from "@/constants/cache-keys";
/**
 * Custom hook for fetching news data with SWR
 * @returns News data, loading state, error state, and mutate function
 */
export function useLenaProfiles() {
	// Use SWR with our server action as the fetcher
	const { data, error, isLoading, mutate } = useSWR<LenaProfiles[], Error>(
		LENA_PROFILES_CACHE_KEY,
		async () => {
			const result = await getAllLenaProfilesAction();

			// Handle error from server action
			if (!result || "error" in result) {
				throw new Error(result?.error || "Failed to fetch Lena profiles");
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
		lenaProfiles: data || [],
		isLoading,
		error,
		mutate,
	};
}
