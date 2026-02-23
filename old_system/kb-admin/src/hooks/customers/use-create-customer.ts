"use client";

import { useState } from "react";
import { createCustomerAction } from "@/actions/customer-actions";
import type { AddCustomerFormType } from "@/schema";
import type { Customer } from "@/db/schema";
import { CUSTOMERS_CACHE_KEY } from "@/constants/cache-keys";
import { mutate } from "swr";

/**
 * Custom hook for creating a new customer with automatic SWR cache invalidation
 * @returns Functions for handling customer creation
 */
export function useCreateCustomer() {
	const [isCreating, setIsCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [createdCustomer, setCreatedCustomer] = useState<Customer | null>(null);

	const createCustomer = async (data: AddCustomerFormType) => {
		setIsCreating(true);
		setError(null);

		try {
			const result = await createCustomerAction(data);

			if ("error" in result) {
				setError(result.error || "Unknown error occurred");
				return null;
			}

			// Update the customers cache with the new customer (optimistic update)
			mutate(CUSTOMERS_CACHE_KEY, (currentCustomers = []) => {
				return [result.customer, ...currentCustomers];
			});

			mutate(`${CUSTOMERS_CACHE_KEY}/stats`);

			// Store the created customer for reference
			setCreatedCustomer(result.customer);

			return result.customer;
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
			return null;
		} finally {
			setIsCreating(false);
		}
	};

	const resetState = () => {
		setCreatedCustomer(null);
		setError(null);
	};

	return {
		createCustomer,
		isCreating,
		error,
		createdCustomer,
		resetState,
	};
}
