"use client";

import useSWR, { mutate as globalMutate } from "swr";
import { getKnowledgeBaseFileStatusAction } from "@/actions/knowledge-actions";
import { useEffect, useCallback } from "react";
import { KNOWLEDGE_BASE_ALL_STATUS_CACHE_KEY } from "@/constants/cache-keys";

export type KnowledgeBaseFileStatus = {
	id: string;
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
	errorMessage?: string | null;
};

/**
 * Custom hook for fetching a single knowledge base file with SWR
 * Implements polling for files that are being processed
 * @param fileId - The ID of the file to fetch
 * @returns File data, loading state, error state, and processing state information
 */
export function useKnowledgeBaseFileStatus(fileId: string) {
	// Determine if the file is being processed and needs polling
	const shouldPoll = useCallback(
		(
			data: KnowledgeBaseFileStatus | { error: string } | undefined,
		): boolean => {
			if (!data || (typeof data === "object" && "error" in data)) return false;

			const status = data.processingStatus;
			return status !== "completed" && status !== "failed";
		},
		[],
	);

	// Use SWR with polling config based on processing status
	const { data, error, isLoading, mutate } = useSWR<
		KnowledgeBaseFileStatus | { error: string }
	>(
		fileId ? `knowledge-base-file-${fileId}` : null,
		async () => {
			const result = await getKnowledgeBaseFileStatusAction(fileId);
			return result;
		},
		{
			refreshInterval: 0, // Start with no polling, we'll handle this programmatically
			revalidateOnFocus: false,
			dedupingInterval: 500, // Shorter deduping interval for more responsive polling
		},
	);

	// Setup polling effect
	useEffect(() => {
		// If the file is processing, setup polling
		if (data && !isLoading && shouldPoll(data)) {
			// Add a small random delay to stagger requests when multiple files are processing
			// This prevents all files from polling at exactly the same time
			const randomDelay = Math.floor(Math.random() * 500);

			const pollingInterval = setInterval(() => {
				// Update the file data
				mutate();

				// Only update the global status once every 3 polls to reduce contention
				// This still provides updates but prevents excessive global cache mutations
				if (Math.random() < 0.33) {
					globalMutate(KNOWLEDGE_BASE_ALL_STATUS_CACHE_KEY);
				}
			}, 2000 + randomDelay); // Increase interval and add staggering

			// Cleanup interval when component unmounts or data changes
			return () => clearInterval(pollingInterval);
		}

		// If the file just finished processing (no longer needs polling),
		// update the status badge one final time
		if (data && !isLoading && !shouldPoll(data)) {
			globalMutate(KNOWLEDGE_BASE_ALL_STATUS_CACHE_KEY);
		}
	}, [data, isLoading, mutate, shouldPoll]);

	// Determine if the file is being processed
	const isProcessing =
		data &&
		!("error" in data) &&
		data.processingStatus !== "completed" &&
		data.processingStatus !== "failed";

	// Determine if processing has failed
	const hasFailed =
		data && !("error" in data) && data.processingStatus === "failed";

	// Get current processing step index for displaying in UI
	const processingSteps = [
		"uploaded",
		"downloading",
		"partitioning",
		"cleaning",
		"chunking",
		"embedding",
		"indexing",
		"completed",
	];

	const currentStepIndex =
		data && !("error" in data)
			? processingSteps.indexOf(data.processingStatus)
			: 0;

	// Calculate progress percentage based on current step
	const progressPercentage =
		currentStepIndex >= 0
			? Math.min(
					Math.round((currentStepIndex / (processingSteps.length - 1)) * 100),
					100,
				)
			: 0;

	return {
		file: data && !("error" in data) ? data : null,
		isLoading,
		error: error || (data && "error" in data ? new Error(data.error) : null),
		isProcessing,
		hasFailed,
		currentStepIndex,
		processingStatus: data && !("error" in data) ? data.processingStatus : null,
		progressPercentage,
		refreshData: mutate,
	};
}
