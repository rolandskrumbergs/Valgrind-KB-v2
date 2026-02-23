import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const KnowledgeStatsLoading = () => {
	return (
		<div className="h-full bg-muted rounded-lg flex flex-col">
			<div className="flex flex-col flex-1">
				<div className="flex flex-col items-center py-6">
					<p className="text-sm font-medium text-muted-foreground">
						Active Files
					</p>
					<Skeleton className="h-9 rounded-md  w-10 mt-2" />
				</div>
				<div className="w-2/3 mx-auto h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />

				<div className="flex-1 overflow-auto">
					<h4 className="text-center py-4 text-sm font-medium text-muted-foreground">
						Files by Category
					</h4>
					<div className="flex flex-col">
						<div className="flex flex-col items-center py-4">
							<p className="text-sm font-medium text-muted-foreground">Books</p>
							<Skeleton className="h-8 rounded-md w-8 mt-2" />
						</div>
						<div className="w-2/3 mx-auto h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
					</div>
					<div className="flex flex-col">
						<div className="flex flex-col items-center py-4">
							<p className="text-sm font-medium text-muted-foreground">Laws</p>
							<Skeleton className="h-8 rounded-md w-8 mt-2" />
						</div>
						<div className="w-2/3 mx-auto h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
					</div>
					<div className="flex flex-col">
						<div className="flex flex-col items-center py-4">
							<p className="text-sm font-medium text-muted-foreground">
								Legal Cases
							</p>
							<Skeleton className="h-8 rounded-md w-8 mt-2" />
						</div>
						<div className="w-2/3 mx-auto h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
					</div>
					<div className="flex flex-col">
						<div className="flex flex-col items-center py-4">
							<p className="text-sm font-medium text-muted-foreground">Other</p>
							<Skeleton className="h-8 rounded-md w-8 mt-2" />
						</div>
						<div className="w-2/3 mx-auto h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
					</div>
				</div>
			</div>
		</div>
	);
};

export default KnowledgeStatsLoading;
