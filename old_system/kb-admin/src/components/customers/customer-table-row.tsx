"use client";

import type { Customer } from "@/db/schema";
import Link from "next/link";

interface CustomerTableRowProps {
	customer: Customer;
}

export function CustomerTableRow({ customer }: CustomerTableRowProps) {
	return (
		<Link
			className="cursor-pointer hover:bg-muted-foreground/20 grid grid-cols-5 p-3 items-center justify-between"
			href={`/customers/${customer.id}`}
		>
			<div>{customer.name}</div>
			<div>{customer.contactInfo}</div>
			<div>{customer.invoiceInfo}</div>
			<div>
				{customer.users}/{customer.licenses}
			</div>
			<div>{new Date(customer.createdAt).toLocaleDateString()}</div>
		</Link>
	);
}
