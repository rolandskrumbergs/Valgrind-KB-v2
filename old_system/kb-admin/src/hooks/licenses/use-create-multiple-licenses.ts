"use client";

import { useState } from "react";
import { createLicenseAction } from "@/actions/license-actions";
import type { License } from "@/db/schema";
import { mutate } from "swr";
import {
	LICENSES_CACHE_KEY,
	CUSTOMERS_CACHE_KEY,
} from "@/constants/cache-keys";

interface CreateMultipleLicensesResult {
	created: number;
	errors: Array<{ userId: string; error: string }>;
	licenses: License[];
}

/**
 * Custom hook for creating multiple licenses at once with automatic SWR cache invalidation
 * @returns Functions for handling multiple license creation
 */
export function useCreateMultipleLicenses() {
	const [isCreating, setIsCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<CreateMultipleLicensesResult | null>(null);

	const createMultipleLicenses = async (userIds: string[], customerId: string) => {
		setIsCreating(true);
		setError(null);
		setResult(null);

		try {
			const actionResult = await createLicenseAction(userIds, customerId);

			if ("error" in actionResult) {
				setError(actionResult.error);
				return null;
			}

			// Update the licenses cache with the new licenses (optimistic update)
			mutate(
				`${LICENSES_CACHE_KEY}-${customerId}`,
				(currentLicenses = []) => {
					const newLicenses = Array.isArray(actionResult) ? actionResult : [actionResult];
					return [...newLicenses, ...currentLicenses];
				},
				{
					revalidate: false,
				},
			);

			mutate(`${CUSTOMERS_CACHE_KEY}/stats`);

			// Create result object
			const licenses = Array.isArray(actionResult) ? actionResult : [actionResult];
			const createResult: CreateMultipleLicensesResult = {
				created: licenses.length,
				errors: [],
				licenses,
			};

			setResult(createResult);
			return createResult;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : "An error occurred";
			setError(errorMessage);
			return null;
		} finally {
			setIsCreating(false);
		}
	};

	const resetState = () => {
		setResult(null);
		setError(null);
	};

	return {
		createMultipleLicenses,
		isCreating,
		error,
		result,
		resetState,
	};
}
