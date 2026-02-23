"use client";

import useSWR from "swr";
import { getTokenUsageAction } from "@/actions/chat-actions";
import type { TokenUsage } from "@/db/schema";
import { TOKEN_USAGE_CACHE_KEY } from "@/constants/cache-keys";

/**
 * Custom hook for fetching token usage data with SWR
 * @returns Token usage data, loading state, error state, and mutate function
 */
export function useTokenUsage() {
	// Use SWR with our server action as the fetcher
	const { data, error, isLoading, mutate } = useSWR<TokenUsage[], Error>(
		TOKEN_USAGE_CACHE_KEY,
		async () => {
			const result = await getTokenUsageAction(10, 0);

			// Handle error from server action
			if ("error" in result) {
				throw new Error(result.error);
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
		tokenUsage: data || [],
		isLoading,
		error,
		mutate,
	};
}
