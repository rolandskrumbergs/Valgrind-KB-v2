"use client";

import { useState } from "react";
import { deleteCustomerAction } from "@/actions/customer-actions";
import { CUSTOMERS_CACHE_KEY } from "@/constants/cache-keys";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import type { Customer } from "@/db/schema";

export function useDeleteCustomer() {
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	const deleteCustomer = async (customerId: string) => {
		setIsDeleting(true);
		setError(null);

		try {
			const result = await deleteCustomerAction(customerId);

			if ("error" in result) {
				setError(result.error || "Unknown error occurred");
				return false;
			}

			// Update the customers cache to remove the deleted customer
			mutate(CUSTOMERS_CACHE_KEY, (currentCustomers: Customer[] = []) => {
				return currentCustomers.filter(
					(customer) => customer.id !== customerId,
				);
			});

			// Update stats cache
			mutate(`${CUSTOMERS_CACHE_KEY}/stats`);

			// Redirect to customers page (the user detail page will no longer exist)
			router.push("/customers");

			return true;
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
			return false;
		} finally {
			setIsDeleting(false);
		}
	};

	return {
		deleteCustomer,
		isDeleting,
		error,
	};
}
