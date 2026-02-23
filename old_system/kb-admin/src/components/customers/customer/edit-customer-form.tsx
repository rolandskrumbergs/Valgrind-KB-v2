import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { editCustomerFormSchema } from "@/schema";
import type { EditCustomerFormType } from "@/schema";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Customer } from "@/db/schema";
import { useUpdateCustomer } from "@/hooks/customers/use-update-customer";
import { Info } from "lucide-react";
import { useState, useEffect } from "react";

export const EditCustomerForm = ({
	setOpen,
	customer,
}: { setOpen: (open: boolean) => void; customer: Customer }) => {
	const { updateCustomer, isUpdating, error } = useUpdateCustomer(customer.id);
	const [usedLicenses] = useState(customer.users || 0);

	const form = useForm<EditCustomerFormType>({
		resolver: zodResolver(editCustomerFormSchema(usedLicenses)),
		defaultValues: {
			name: customer.name,
			contactInfo: customer.contactInfo,
			invoiceInfo: customer.invoiceInfo,
			licenses: customer.licenses,
		},
	});

	// Update validation when usedLicenses changes
	useEffect(() => {
		form.trigger("licenses");
	}, [form]);

	const onSubmit = async (data: EditCustomerFormType) => {
		try {
			const updatedCustomer = await updateCustomer(data);
			if (updatedCustomer) {
				toast.success("Customer updated successfully");
				setOpen(false);
			}
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to update customer",
			);
		}
	};

	if (error) {
		toast.error(error);
	}

	return (
		<div className="flex flex-col">
			<div className="flex flex-row border-b border-white/5 p-4 gap-2 items-center justify-between">
				<div className="flex flex-col">
					<h2 className="text-lg font-bold">Edit Customer</h2>
				</div>
			</div>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex flex-col gap-4 p-4 bg-muted"
				>
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<FormControl>
									<Input
										placeholder="User Name"
										className="bg-primary-foreground"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="contactInfo"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Contact Info</FormLabel>
								<FormControl>
									<Input
										placeholder="Contact Info"
										className="bg-primary-foreground"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="invoiceInfo"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Invoice Info</FormLabel>
								<FormControl>
									<Input
										placeholder="Invoice Info"
										className="bg-primary-foreground"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="licenses"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="flex items-center gap-2">
									Licenses
									{usedLicenses > 0 && (
										<span className="text-xs flex items-center gap-1 text-muted-foreground">
											<Info className="h-3 w-3" />
											Currently using {usedLicenses} licenses
										</span>
									)}
								</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={usedLicenses}
										placeholder="Licenses"
										className="bg-primary-foreground"
										{...field}
										onChange={(e) => field.onChange(Number(e.target.value))}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="flex justify-end gap-2 w-full items-center">
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
							className="cursor-pointer"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="default"
							disabled={isUpdating || !form.formState.isDirty}
							className="cursor-pointer"
						>
							{isUpdating ? "Updating..." : "Update"}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
};
