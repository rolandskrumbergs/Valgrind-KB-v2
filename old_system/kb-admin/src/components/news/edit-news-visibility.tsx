"use client";

import { useCustomers } from "@/hooks/customers/use-customers";
import { cn } from "@/lib/utils";
import { Label } from "../ui/label";
import { Skeleton } from "../ui/skeleton";

const ToggleVisibility = ({
	excludedCustomers,
	setExcludedCustomers,
}: {
	excludedCustomers: string[];
	setExcludedCustomers: (excludedCustomers: string[]) => void;
}) => {
	const { customers, isLoading, error } = useCustomers();

	if (isLoading) {
		return (
			<div className="h-fit w-full bg-muted flex flex-col gap-2 px-4">
				<Label className="font-medium text-foreground">
					Select Customers who can see this news
				</Label>
				<div className="flex flex-row gap-2">
					<Skeleton className="h-[27px] w-24 bg-muted-foreground/20  rounded-full" />
					<Skeleton className="h-[27px] w-24 bg-muted-foreground/20  rounded-full" />
					<Skeleton className="h-[27px] w-24 bg-muted-foreground/20  rounded-full" />
				</div>
			</div>
		);
	}

	if (error) {
		return <div>Error loading customers</div>;
	}

	const toggleCustomer = (customerId: string) => {
		if (excludedCustomers.includes(customerId)) {
			// Remove from excluded list
			setExcludedCustomers(
				excludedCustomers.filter((id: string) => id !== customerId),
			);
		} else {
			// Add to excluded list
			setExcludedCustomers([...excludedCustomers, customerId]);
		}
	};

	// Toggle all customers' visibility
	const toggleAllCustomers = () => {
		if (excludedCustomers.length === customers.length) {
			// If all are visible, make none visible (exclude all)
			setExcludedCustomers([]);
		} else {
			// If some or none are visible, make all visible (exclude none)
			setExcludedCustomers(customers.map((customer) => customer.id));
		}
	};

	return (
		<div className="h-fit w-full bg-muted flex flex-col gap-2 px-4">
			<Label className="font-medium text-foreground">
				Select Customers who can see this news
			</Label>

			<div className="flex flex-wrap gap-2">
				<button
					type="button"
					className={cn(
						"px-3 rounded-full text-sm h-fit transition-colors cursor-pointer",
						excludedCustomers.length === 0
							? "bg-muted-foreground text-background border border-muted-foreground border-dashed"
							: "bg-transparent border border-muted-foreground border-dashed text-muted-foreground hover:bg-muted",
					)}
					onClick={toggleAllCustomers}
				>
					All
				</button>
				{customers?.map((customer) => {
					const isVisible = !excludedCustomers.includes(customer.id);
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

export default ToggleVisibility;
