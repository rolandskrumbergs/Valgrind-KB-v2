"use client";

import useSWR from "swr";
import { getKnowledgeBaseInvocationsAction } from "@/actions/chat-actions";
import type { KnowledgeBaseInvocation } from "@/db/schema";
import { KNOWLEDGE_BASE_INVOCATIONS_CACHE_KEY } from "@/constants/cache-keys";

/**
 * Custom hook for fetching news data with SWR
 * @returns News data, loading state, error state, and mutate function
 */
export function useKnowledgeBaseInvocations() {
	// Use SWR with our server action as the fetcher
	const { data, error, isLoading, mutate } = useSWR<
		KnowledgeBaseInvocation[],
		Error
	>(
		KNOWLEDGE_BASE_INVOCATIONS_CACHE_KEY,
		async () => {
			const result = await getKnowledgeBaseInvocationsAction();

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
		functionInvocations: data || [],
		isLoading,
		error,
		mutate,
	};
}
