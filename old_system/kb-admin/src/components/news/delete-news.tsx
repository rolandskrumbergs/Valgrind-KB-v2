"use client";

import type { News } from "@/db/schema";
import { deleteNewsAction } from "@/actions/news-actions";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { ResponsiveDialog } from "../responsive-dialog";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

const DeleteNews = ({ news }: { news: News }) => {
	const [openDelete, setOpenDelete] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			await deleteNewsAction(news.id);

			toast.success("News deleted successfully");
		} catch (error) {
			toast.error("Failed to delete news");
			console.error(error);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
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
			title="Delete News"
			description="This action is irreversible"
			className="sm:max-w-md"
		>
			<div className="flex flex-col gap-4 p-4">
				<div className="flex items-center gap-3 p-3 bg-destructive/20 rounded-md border border-destructive/20 text-red-500">
					<AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
					<p className="font-medium text-sm">Warning: This cannot be undone</p>
				</div>

				<div className="flex justify-end gap-2 mt-2">
					<Button variant="outline" onClick={() => setOpenDelete(false)}>
						Cancel
					</Button>
					<Button
						variant="destructive"
						disabled={isDeleting}
						onClick={handleDelete}
					>
						{isDeleting ? "Deleting..." : "Delete News"}
					</Button>
				</div>
			</div>
		</ResponsiveDialog>
	);
};

export default DeleteNews;
