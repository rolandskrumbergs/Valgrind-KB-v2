"use client";

import { useCustomers } from "./use-customers";

type CustomerNavItem = {
	name: string;
	url: string;
};

/**
 * Hook that transforms the customer data into navigation-friendly format
 * Reuses the existing SWR cache from useCustomers
 * Only returns the latest 5 customers for the navigation menu
 */
export function useCustomerNav() {
	const { customers, isLoading, error } = useCustomers();

	// Transform the customer data into the format needed for navigation
	// Only take the first 5 customers (which are already sorted by created_at desc)
	const navItems: CustomerNavItem[] = customers.slice(0, 5).map((customer) => ({
		name: customer.name,
		url: `/customers/${customer.id}`,
	}));

	return {
		customers: navItems,
		totalCount: customers.length,
		isLoading,
		error,
	};
}
