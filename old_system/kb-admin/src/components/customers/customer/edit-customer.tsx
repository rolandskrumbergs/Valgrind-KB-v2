"use client";

import type { Customer } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { EditCustomerForm } from "./edit-customer-form";
import { useState } from "react";
import { useDeleteCustomer } from "@/hooks/customers/use-delete-customer";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

const EditCustomer = ({
	customer,
}: {
	customer: Customer;
}) => {
	const [openEdit, setOpenEdit] = useState(false);
	const [openDelete, setOpenDelete] = useState(false);
	const [deleteConfirmation, setDeleteConfirmation] = useState("");
	const { deleteCustomer, isDeleting, error } = useDeleteCustomer();

	const expectedConfirmation = `delete ${customer.name}`;
	const isDeleteConfirmationValid =
		deleteConfirmation.toLowerCase() === expectedConfirmation.toLowerCase();

	const handleDelete = async () => {
		if (!isDeleteConfirmationValid) return;

		const success = await deleteCustomer(customer.id);
		if (success) {
			toast.success(`Customer "${customer.name}" has been deleted`);
		} else if (error) {
			toast.error(error);
		}
	};

	return (
		<div className="h-fit w-full bg-muted flex flex-col gap-4 rounded-lg p-4">
			<div>
				<p className="text-muted-foreground text-sm">Customer Name</p>
				<h2 className="text-sm font-bold">{customer.name}</h2>
			</div>
			<div>
				<p className="text-muted-foreground text-sm">Contact Information</p>
				<h2 className="text-sm">{customer.contactInfo}</h2>
			</div>

			<div>
				<p className="text-muted-foreground text-sm">Invoice Information</p>
				<h2 className="text-sm">{customer.invoiceInfo}</h2>
			</div>
			<div>
				<p className="text-muted-foreground text-sm">Total Licenses</p>
				<h2 className="text-sm font-bold">{customer.licenses}</h2>
			</div>

			<div className="flex gap-2 w-full justify-end">
				<ResponsiveDialog
					open={openEdit}
					onOpenChange={setOpenEdit}
					trigger={
						<Button
							size="sm"
							className="bg-foreground/10 text-foreground/60 font-normal border-dashed border-foreground/20 hover:text-primary border hover:border-foreground/50 hover:bg-foreground/20"
						>
							edit
						</Button>
					}
					title="Edit Customer"
					description={`Edit ${customer.name}`}
					className="sm:max-w-xl"
				>
					<EditCustomerForm setOpen={setOpenEdit} customer={customer} />
				</ResponsiveDialog>

				<ResponsiveDialog
					open={openDelete}
					onOpenChange={setOpenDelete}
					trigger={
						<Button
							variant="destructive"
							size="sm"
							className="bg-destructive/40 text-destructive-foreground font-normal border-dashed border-destructive hover:text-foreground border hover:bg-destructive"
						>
							delete
						</Button>
					}
					title="Delete Customer"
					description="This action is irreversible"
					className="sm:max-w-md"
				>
					<div className="flex flex-col gap-4 p-4">
						<div className="flex items-start gap-3 p-3 bg-destructive/20 rounded-md border border-destructive/20 text-red-500">
							<AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
							<div className="text-sm">
								<p className="font-medium mb-1">
									Warning: This cannot be undone
								</p>
								<p>
									Deleting this customer will permanently remove all associated
									data including:
								</p>
								<ul className="list-disc pl-5 mt-2 space-y-1">
									<li>All user accounts for this customer</li>
									<li>All license information</li>
									<li>All usage history and data</li>
								</ul>
							</div>
						</div>

						<div className="flex flex-col gap-2 mt-2">
							<label
								htmlFor="delete-confirmation"
								className="text-sm font-medium"
							>
								Type{" "}
								<span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">
									{expectedConfirmation}
								</span>{" "}
								to confirm:
							</label>
							<Input
								id="delete-confirmation"
								value={deleteConfirmation}
								onChange={(e) => setDeleteConfirmation(e.target.value)}
								placeholder={expectedConfirmation}
								className="bg-background"
							/>
						</div>

						<div className="flex justify-end gap-2 mt-2">
							<Button variant="outline" onClick={() => setOpenDelete(false)}>
								Cancel
							</Button>
							<Button
								variant="destructive"
								disabled={!isDeleteConfirmationValid || isDeleting}
								onClick={handleDelete}
							>
								{isDeleting ? "Deleting..." : "Delete Customer"}
							</Button>
						</div>
					</div>
				</ResponsiveDialog>
			</div>
		</div>
	);
};

export default EditCustomer;
