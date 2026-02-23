"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { ResponsiveDialog } from "../responsive-dialog";
import AddCustomerForm from "./add-customer-form";

const AddCustomer = () => {
	const [open, setOpen] = useState(false);

	return (
		<div className="h-fit bg-muted rounded-lg p-4 gap-4 flex flex-col">
			<div className="flex flex-col">
				<h1 className="text-xl font-semibold">Add Customer</h1>
				<p className="text-sm text-muted-foreground">
					Add a new customer to Ibben
				</p>
			</div>
			<ResponsiveDialog
				open={open}
				onOpenChange={setOpen}
				trigger={
					<Button variant="default" size="lg" className="cursor-pointer">
						<Plus className="w-4 h-4" />
						New Customer
					</Button>
				}
				title="New Customer"
				description="Add a new customer to Ibben"
				className="sm:max-w-xl"
			>
				<AddCustomerForm setOpen={setOpen} />
			</ResponsiveDialog>
		</div>
	);
};

export default AddCustomer;
