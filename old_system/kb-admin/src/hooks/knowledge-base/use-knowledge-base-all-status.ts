"use client";

import useSWR from "swr";
import { getKnowledgeBaseAllStatusAction } from "@/actions/knowledge-actions";
import { KNOWLEDGE_BASE_ALL_STATUS_CACHE_KEY } from "@/constants/cache-keys";

export type KnowledgeBaseFileStatus = {
	processingStatus:
		| "uploaded"
		| "downloading"
		| "partitioning"
		| "cleaning"
		| "chunking"
		| "embedding"
		| "indexing"
		| "completed"
		| "failed";
};

/**
 * Custom hook for fetching knowledge base files with SWR
 * @returns Knowledge base files data, loading state, error state, and mutate function
 */
export function useKnowledgeBaseAllStatus() {
	// Use SWR with our server action as the fetcher
	const { data, error, isLoading, mutate } = useSWR<
		KnowledgeBaseFileStatus[],
		Error
	>(
		KNOWLEDGE_BASE_ALL_STATUS_CACHE_KEY,
		async () => {
			const result = await getKnowledgeBaseAllStatusAction();

			// Handle error from server action
			if (result && typeof result === "object" && "error" in result) {
				throw new Error(result.error);
			}

			return result as KnowledgeBaseFileStatus[];
		},
		{
			revalidateOnFocus: true,
			revalidateOnReconnect: true,
			// Dynamic refresh interval based on processing status
			refreshInterval: (data) => {
				// Check if any files are in a processing state
				const hasProcessingFiles = data?.some(
					(file) =>
						file.processingStatus !== "completed" &&
						file.processingStatus !== "failed",
				);

				// Use shorter interval for active processing, longer interval otherwise
				return hasProcessingFiles ? 3000 : 30000; // 3 seconds for consistency with lite hook
			},
			dedupingInterval: 2000, // Match with lite hook for consistency
			keepPreviousData: true,
		},
	);

	return {
		knowledgeBaseStatus: data || [],
		isLoading,
		error,
		mutate,
	};
}
