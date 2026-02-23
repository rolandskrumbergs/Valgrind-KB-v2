import { useCustomers } from "@/hooks/customers/use-customers";
import { cn } from "@/lib/utils";
import React, { useState, useEffect, useCallback } from "react";
import { Label } from "../ui/label";

interface NewsVisibilityProps {
	onChange?: (excludedCustomers: string[]) => void;
}

const NewsVisibility = ({ onChange }: NewsVisibilityProps) => {
	const { customers, isLoading, error } = useCustomers();
	const [visibleCustomers, setVisibleCustomers] = useState<string[]>([]);

	// Initialize visibleCustomers to all customers when data loads
	useEffect(() => {
		if (customers && customers.length > 0) {
			// By default, all customers can see the news
			setVisibleCustomers(customers.map((customer) => customer.id));
		}
	}, [customers]);

	// Memoize the calculation and update of excluded customers
	const updateExcludedCustomers = useCallback(() => {
		if (!customers || !onChange) return;

		// Calculate excluded customers (all customers - visible customers)
		const excluded = customers
			.map((customer) => customer.id)
			.filter((id) => !visibleCustomers.includes(id));

		onChange(excluded);
	}, [customers, visibleCustomers, onChange]);

	// Update excluded customers when visible customers change
	useEffect(() => {
		if (customers && customers.length > 0) {
			updateExcludedCustomers();
		}
	}, [customers, updateExcludedCustomers]);

	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (error) {
		return <div>Error loading customers</div>;
	}

	// Toggle a single customer's visibility
	const toggleCustomer = (customerId: string) => {
		setVisibleCustomers(
			(prev) =>
				prev.includes(customerId)
					? prev.filter((id) => id !== customerId) // Remove from visible
					: [...prev, customerId], // Add to visible
		);
	};

	// Toggle all customers' visibility
	const toggleAllCustomers = () => {
		if (visibleCustomers.length === customers.length) {
			// If all are visible, make none visible (exclude all)
			setVisibleCustomers([]);
		} else {
			// If some or none are visible, make all visible (exclude none)
			setVisibleCustomers(customers.map((customer) => customer.id));
		}
	};

	const isAllSelected =
		visibleCustomers.length === customers.length && customers.length > 0;

	return (
		<div className="space-y-3">
			<Label className="font-medium text-foreground">
				Select Customers who can see this news post
			</Label>

			<div className="flex flex-wrap gap-2">
				<button
					type="button"
					onClick={toggleAllCustomers}
					className={cn(
						"px-3 rounded-full text-sm h-fit font-medium transition-colors cursor-pointer",
						isAllSelected
							? "bg-muted-foreground text-background border border-muted-foreground border-dashed"
							: "bg-transparent border border-muted-foreground border-dashed text-muted-foreground hover:bg-muted",
					)}
				>
					All
				</button>

				{customers?.map((customer) => {
					const isVisible = visibleCustomers.includes(customer.id);
					return (
						<button
							key={customer.id}
							type="button"
							onClick={() => toggleCustomer(customer.id)}
							className={cn(
								"px-3 rounded-full text-sm h-fit transition-colors cursor-pointer",
								isVisible
									? "bg-emerald-500 text-background border border-emerald-500"
									: "bg-transparent border border-muted-foreground border-dashed text-muted-foreground hover:bg-muted-foreground/10",
							)}
						>
							{customer.name}
						</button>
					);
				})}
			</div>
		</div>
	);
};

export default NewsVisibility;
