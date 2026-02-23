"use client";

import React, { useMemo } from "react";
import { useKnowledgeBaseLite } from "@/hooks/knowledge-base/use-knowledge-base-lite";
import KnowledgeBaseLoading from "@/app/@dashboard/(lena)/knowledge-base/_loading/knowledge-stats-loading";

const KnowledgeStats = () => {
	const { knowledgeBaseFiles, isLoading, error } = useKnowledgeBaseLite();

	const stats = useMemo(() => {
		const completedFiles = knowledgeBaseFiles.filter(
			(file) => file.processingStatus === "completed",
		);

		// Calculate files by category
		const categoryCounts: Record<string, number> = {};
		for (const file of knowledgeBaseFiles) {
			if (!categoryCounts[file.category]) {
				categoryCounts[file.category] = 0;
			}
			categoryCounts[file.category]++;
		}

		return {
			completedFiles: completedFiles.length,
			categoryCounts,
		};
	}, [knowledgeBaseFiles]);

	if (error) {
		return (
			<div className="h-full bg-muted rounded-lg p-4 gap-6 flex flex-col">
				<div className="flex flex-col">
					<h1 className="text-xl font-semibold">Info</h1>
					<p className="text-sm text-red-500">
						Error loading customer information.
					</p>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return <KnowledgeBaseLoading />;
	}

	return (
		<div className="h-full bg-muted rounded-lg flex flex-col">
			<div className="flex flex-col flex-1">
				<div className="flex flex-col items-center py-6">
					<p className="text-sm font-medium text-muted-foreground">
						Active Files
					</p>
					<h3 className="text-3xl font-bold mt-2">{stats.completedFiles}</h3>
				</div>
				<div className="w-2/3 mx-auto h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />

				<div className="flex-1 overflow-auto">
					<h4 className="text-center py-4 text-sm font-medium text-muted-foreground">
						Files by Category
					</h4>
					{Object.entries(stats.categoryCounts).map(([category, count]) => (
						<div key={category} className="flex flex-col">
							<div className="flex flex-col items-center py-4">
								<p className="text-sm font-medium text-muted-foreground">
									{category || "Uncategorized"}
								</p>
								<h3 className="text-2xl font-bold mt-2">{count}</h3>
							</div>
							<div className="w-2/3 mx-auto h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default KnowledgeStats;
