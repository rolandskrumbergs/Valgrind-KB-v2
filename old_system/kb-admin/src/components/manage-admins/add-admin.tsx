"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import AddAdminForm from "./add-admin-form";
import { ResponsiveDialog } from "../responsive-dialog";

export default function AddAdmin() {
	const [open, setOpen] = useState(false);

	return (
		<div className="h-fit bg-muted rounded-lg p-4 gap-6 flex flex-col md:flex-row md:items-center md:justify-between">
			<div className="flex flex-col">
				<h1 className="text-xl font-semibold">Add Admin</h1>
				<p className="text-sm text-muted-foreground">
					Add a new admin to the system
				</p>
			</div>
			<ResponsiveDialog
				open={open}
				onOpenChange={setOpen}
				trigger={
					<Button variant="default" size="lg" className="cursor-pointer">
						<Plus className="w-4 h-4" />
						Add Admin
					</Button>
				}
				title="Add Admin"
				description="Add a new admin to the system"
				className="sm:max-w-xl"
			>
				<AddAdminForm setOpen={setOpen} />
			</ResponsiveDialog>
		</div>
	);
}
