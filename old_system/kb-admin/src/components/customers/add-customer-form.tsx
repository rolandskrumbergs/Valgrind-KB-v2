import React from "react";
import { Button } from "../ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "../ui/input";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../ui/form";
import type { AddCustomerFormType } from "@/schema";
import { addCustomerFormSchema } from "@/schema";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { useCreateCustomer } from "@/hooks/customers/use-create-customer";

const AddCustomerForm = ({ setOpen }: { setOpen: (open: boolean) => void }) => {
	const { createCustomer, createdCustomer, isCreating, error, resetState } =
		useCreateCustomer();

	const form = useForm<AddCustomerFormType>({
		resolver: zodResolver(addCustomerFormSchema),
		defaultValues: {
			name: "",
			contactInfo: "",
			invoiceInfo: "",
			licenses: 1,
		},
	});

	const onSubmit = async (data: AddCustomerFormType) => {
		try {
			const result = await createCustomer(data);
			if (result) {
				toast.success("Customer created successfully");
			} else if (error) {
				toast.error(error);
			}
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to create customer",
			);
		}
	};

	if (createdCustomer) {
		return (
			<div className="flex flex-col">
				<div className="flex flex-col items-center justify-center p-8 gap-4">
					<CheckCircle2 className="w-12 h-12 text-green-500" />
					<h2 className="text-xl font-bold">Customer Created Successfully</h2>
					<div className="w-full space-y-2 text-sm">
						<div className="flex justify-between items-center p-2 bg-muted rounded-lg">
							<span className="text-muted-foreground">Name:</span>
							<span className="font-medium">{createdCustomer.name}</span>
						</div>
						<div className="flex justify-between items-center p-2 bg-muted rounded-lg">
							<span className="text-muted-foreground">Contact Info:</span>
							<span className="font-medium">{createdCustomer.contactInfo}</span>
						</div>
						<div className="flex justify-between items-center p-2 bg-muted rounded-lg">
							<span className="text-muted-foreground">Invoice Info:</span>
							<span className="font-medium">{createdCustomer.invoiceInfo}</span>
						</div>
						<div className="flex justify-between items-center p-2 bg-muted rounded-lg">
							<span className="text-muted-foreground">Licenses:</span>
							<span className="font-medium">{createdCustomer.licenses}</span>
						</div>
						<div className="flex justify-between items-center p-2 bg-muted rounded-lg">
							<span className="text-muted-foreground">Created At:</span>
							<span className="font-medium">
								{new Date(createdCustomer.createdAt).toLocaleString()}
							</span>
						</div>
					</div>
					<Button
						onClick={() => {
							resetState();
							form.reset();
							setOpen(false);
						}}
						className="mt-4"
					>
						Close
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col">
			<div className="flex flex-col border-b pb-4 border-white/5 p-4">
				<h2 className="text-lg font-bold">Customer Details</h2>
				<p className="text-sm text-muted-foreground">
					Add a new customer to the system
				</p>
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
										placeholder="Company Name"
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
								<FormLabel>Contact Information</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Contact details"
										className="bg-primary-foreground min-h-[100px]"
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
								<FormLabel>Invoice Information</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Invoice details"
										className="bg-primary-foreground min-h-[100px]"
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
								<FormLabel>Number of Licenses</FormLabel>
								<FormControl>
									<Input
										type="number"
										min="1"
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
							className="cursor-pointer"
							disabled={isCreating}
						>
							{isCreating ? "Creating..." : "Create Customer"}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
};

export default AddCustomerForm;
