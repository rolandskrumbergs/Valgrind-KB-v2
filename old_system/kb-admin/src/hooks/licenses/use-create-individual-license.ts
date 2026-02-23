"use client";

import { useState } from "react";
import { createLicenseAction } from "@/actions/license-actions";
import type { AddUserFormType } from "@/schema";
import type { License, LicenseWithUser } from "@/db/schema";
import { mutate } from "swr";
import {
	LICENSES_CACHE_KEY,
	CUSTOMERS_CACHE_KEY,
} from "@/constants/cache-keys";

/**
 * Custom hook for creating a new individual license with automatic SWR cache invalidation
 * @returns Functions for handling license creation
 */
export function useCreateIndividualLicense() {
	const [isCreating, setIsCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [createdLicense, setCreatedLicense] = useState<LicenseWithUser | LicenseWithUser[] | null>(null);

	const createLicense = async (userId: string | string[], customerId: string) => {
		setIsCreating(true);
		setError(null);

		try {
			const result = await createLicenseAction(userId, customerId);

			if (!result || "error" in result) {
				setError(result?.error || "No result returned");
				return null;
			}

			// Update the licenses cache with the new license(s) (optimistic update)
			mutate(
				`${LICENSES_CACHE_KEY}-${customerId}`,
				(currentLicenses = []) => {
					const newLicenses = Array.isArray(result) ? result : [result];
					return [...newLicenses, ...currentLicenses];
				},
				{
					revalidate: false,
				},
			);

			mutate(`${CUSTOMERS_CACHE_KEY}/stats`);

			// Store the created license(s) for reference
			setCreatedLicense(result);

			return result;
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
			return null;
		} finally {
			setIsCreating(false);
		}
	};

	const resetState = () => {
		setCreatedLicense(null);
		setError(null);
	};

	return {
		createLicense,
		isCreating,
		error,
		createdLicense,
		resetState,
	};
}
