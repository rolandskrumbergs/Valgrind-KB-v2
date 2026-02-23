import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const ManageDocumentsLoading = () => {
	return (
		<div className="h-full w-full bg-muted rounded-lg  flex flex-col col-span-3">
			<div className="flex items-center justify-between h-20 px-4">
				<div className="flex items-start flex-col">
					<div className="flex items-center gap-1">
						<h1 className="text-xl font-semibold">Documents</h1>
					</div>
					<p className="text-sm text-muted-foreground">
						Manage documents in the knowledge base
					</p>
				</div>
			</div>
			<div className="h-12 w-full px-4 flex items-center justify-between">
				<Skeleton className="h-full w-full max-w-sm" />
				<div className="flex items-center gap-2 h-full">
					<Skeleton className="h-10 w-24" />
					<Skeleton className="h-10 w-24" />
				</div>
			</div>
			<div className="relative w-full flex flex-col gap-4">
				<div className="overflow-hidden flex flex-col gap-4 pb-10 pt-4 px-4">
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
				</div>
			</div>
		</div>
	);
};

export default ManageDocumentsLoading;
