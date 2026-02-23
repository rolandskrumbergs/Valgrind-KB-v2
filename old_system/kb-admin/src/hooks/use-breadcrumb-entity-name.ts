"use client";

import useSWR from "swr";
import { getEntityName } from "@/actions/entity-actions";
import { ENTITY_NAME_CACHE_KEY } from "@/constants/cache-keys";

type EntityType = "chat" | "customers" | "news" | "knowledge-base";

// Type for the entity name response
type EntityNameResponse = { name: string } | { name: string; error: string };

/**
 * Custom hook for fetching entity names (title, name) for breadcrumb navigation
 * Uses SWR for caching, revalidation, and deduplication of requests
 */
export function useBreadcrumbEntityName(
	entityType: EntityType | null,
	entityId: string | null,
) {
	// Only create a cache key if both entityType and entityId exist
	const cacheKey =
		entityType && entityId ? ENTITY_NAME_CACHE_KEY(entityType, entityId) : null;

	const { data, error, isLoading } = useSWR<EntityNameResponse>(
		cacheKey,
		async () => {
			if (!entityType || !entityId) {
				return { name: entityId || "" };
			}

			return await getEntityName(entityType, entityId);
		},
		{
			revalidateOnFocus: false, // Breadcrumb data rarely changes during a session
			revalidateOnReconnect: true,
			dedupingInterval: 60000, // Cache for 1 minute
			fallbackData: { name: entityId || "" }, // Use the ID as fallback
			keepPreviousData: true,
		},
	);

	return {
		entityName: data?.name || entityId,
		isLoading,
		error: error as Error | null,
	};
}
