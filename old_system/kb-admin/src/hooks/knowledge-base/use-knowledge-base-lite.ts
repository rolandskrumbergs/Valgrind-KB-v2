"use client";

import useSWR from "swr";
import { getKnowledgeBaseFilesLiteAction } from "@/actions/knowledge-actions";
import { KNOWLEDGE_BASE_LITE_CACHE_KEY } from "@/constants/cache-keys";

export type KnowledgeBaseFileLite = {
	id: string;
	fileName: string;
	fileSize: number;
	fileType: string;
	category: string;
	s3Url: string;
	uploadedAt: Date;
	userName: string | null;
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
export function useKnowledgeBaseLite() {
	// Use SWR with our server action as the fetcher
	const { data, error, isLoading, mutate } = useSWR<
		KnowledgeBaseFileLite[],
		Error
	>(
		KNOWLEDGE_BASE_LITE_CACHE_KEY,
		async () => {
			const result = await getKnowledgeBaseFilesLiteAction();

			// Handle error from server action
			if (result && typeof result === "object" && "error" in result) {
				throw new Error(result.error);
			}

			return result as KnowledgeBaseFileLite[];
		},
		{
			revalidateOnFocus: false,
			revalidateOnReconnect: true,
			dedupingInterval: 5000,
			keepPreviousData: true,
		},
	);

	return {
		knowledgeBaseFiles: data || [],
		isLoading,
		error,
		mutate,
	};
}
