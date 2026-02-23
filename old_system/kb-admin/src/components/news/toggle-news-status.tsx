"use client";

import type { News } from "@/db/schema";
import { updateNewsStatusAction } from "@/actions/news-actions";
import { cn } from "@/lib/utils";
import { Pen, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { NEWS_CACHE_KEY } from "@/constants/cache-keys";
import { mutate } from "swr";

const ToggleNewsStatus = ({ news }: { news: News }) => {
	const [status, setStatus] = useState<"published" | "draft">(news.status);
	const [isLoading, setIsLoading] = useState(false);

	const handleStatusChange = async (newStatus: "published" | "draft") => {
		if (newStatus === status) return;

		setIsLoading(true);

		try {
			const response = await updateNewsStatusAction(news.id, newStatus);

			if (response && "success" in response && response.success) {
				toast.success("News status updated successfully");
				setStatus(newStatus);
				mutate(NEWS_CACHE_KEY);
			} else if (response && "error" in response) {
				toast.error(response.error || "Unknown error occurred");
			} else {
				toast.error("Failed to update status");
			}
		} catch (err) {
			toast.error("An unexpected error occurred");
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="h-fit w-fit  flex flex-row gap-4 items-center justify-between">
			<p className="text-muted-foreground text-sm whitespace-nowrap">
				Set Status
			</p>
			<div className="flex h-8">
				<button
					type="button"
					onClick={() => handleStatusChange("published")}
					disabled={isLoading}
					className={cn(
						"bg-muted-foreground/20 px-3 text-sm rounded-l-md flex items-center gap-2 cursor-pointer",
						status === "published" && "bg-emerald-500/60 text-white",
						isLoading && "opacity-50 cursor-not-allowed",
					)}
				>
					{status === "published" && (
						<Play className="h-3 w-3 text-white" fill="currentColor" />
					)}
					Published
				</button>
				<button
					type="button"
					onClick={() => handleStatusChange("draft")}
					disabled={isLoading}
					className={cn(
						"bg-muted-foreground/20 px-3 text-sm rounded-r-md flex items-center gap-2 cursor-pointer",
						status === "draft" && "bg-primary text-primary-foreground",
						isLoading && "opacity-50 cursor-not-allowed",
					)}
				>
					{status === "draft" && (
						<Pen className="h-3 w-3 text-muted" fill="currentColor" />
					)}
					Draft
				</button>
			</div>
		</div>
	);
};

export default ToggleNewsStatus;
