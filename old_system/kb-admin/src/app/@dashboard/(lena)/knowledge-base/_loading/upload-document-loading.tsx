import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const UploadDocumentLoading = () => {
	return (
		<div className="w-full bg-muted rounded-lg p-4 flex flex-col">
			<div className="flex flex-col px-1 gap-4 w-full">
				<div className="flex justify-between w-full flex-col">
					<h1 className="text-xl font-semibold">Add Documents</h1>
					<p className="text-sm text-muted-foreground">
						Add documents to the knowledge base for Lena AI
					</p>
				</div>
				<Skeleton className="h-10 rounded-md w-full" />
			</div>
		</div>
	);
};

export default UploadDocumentLoading;
