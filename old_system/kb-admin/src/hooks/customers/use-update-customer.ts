"use client";

import { useState } from "react";
import { updateCustomerAction } from "@/actions/customer-actions";
import type { AddCustomerFormType } from "@/schema";
import type { Customer } from "@/db/schema";
import { CUSTOMERS_CACHE_KEY } from "@/constants/cache-keys";
import { mutate } from "swr";

/**
 * Custom hook for updating a customer with automatic SWR cache invalidation
 * @returns Functions for handling customer updates
 */
export function useUpdateCustomer(customerId: string) {
	const [isUpdating, setIsUpdating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [updatedCustomer, setUpdatedCustomer] = useState<Customer | null>(null);

	const updateCustomer = async (data: AddCustomerFormType) => {
		setIsUpdating(true);
		setError(null);

		try {
			const result = await updateCustomerAction(customerId, data);

			if ("error" in result) {
				setError(result.error || "Unknown error occurred");
				return null;
			}

			// Update the customers cache with the updated customer
			mutate(CUSTOMERS_CACHE_KEY, (currentCustomers: Customer[] = []) => {
				return currentCustomers.map((customer) =>
					customer.id === customerId ? result.customer : customer,
				);
			});

			// Update individual customer cache
			mutate(`${CUSTOMERS_CACHE_KEY}/${customerId}`);

			// Update stats
			mutate(`${CUSTOMERS_CACHE_KEY}/stats`);

			// Store the updated customer for reference
			setUpdatedCustomer(result.customer);

			return result.customer;
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
			return null;
		} finally {
			setIsUpdating(false);
		}
	};

	const resetState = () => {
		setUpdatedCustomer(null);
		setError(null);
	};

	return {
		updateCustomer,
		isUpdating,
		error,
		updatedCustomer,
		resetState,
	};
}
