"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { IbbenLenaKnowledgeFile } from "@/db/schema";
import { deleteKnowledgeBaseFileAction } from "@/actions/knowledge-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { KNOWLEDGE_BASE_LITE_CACHE_KEY } from "@/constants/cache-keys";

const DeleteFile = ({
	knowledgeBaseFile,
}: {
	knowledgeBaseFile: IbbenLenaKnowledgeFile;
}) => {
	const [openDelete, setOpenDelete] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const router = useRouter();
	const handleDelete = async () => {
		try {
			setIsDeleting(true);
			setErrorMessage(null);

			const result = await deleteKnowledgeBaseFileAction(knowledgeBaseFile.id);

			if (result.error) {
				setErrorMessage(result.error);
				toast.error(result.error);
				return;
			}

			toast.success(`Successfully deleted ${knowledgeBaseFile.fileName}`);
			setOpenDelete(false);
			mutate(KNOWLEDGE_BASE_LITE_CACHE_KEY);
			router.push("/knowledge-base");
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to delete file. Please try again.";

			console.error("Error deleting file:", error);
			setErrorMessage(message);
			toast.error(message);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<ResponsiveDialog
			open={openDelete}
			onOpenChange={(open) => {
				setOpenDelete(open);
				if (!open) setErrorMessage(null);
			}}
			trigger={
				<Button
					variant="destructive"
					size="sm"
					className="bg-destructive/40 text-destructive-foreground font-normal border-dashed border-destructive hover:text-foreground border hover:bg-destructive"
				>
					delete
				</Button>
			}
			title="Delete File"
			description={`Delete ${knowledgeBaseFile.fileName}`}
			className="sm:max-w-xl"
		>
			<div className="flex flex-col gap-4 p-4">
				<div className="flex items-start gap-3 p-3 bg-destructive/20 rounded-md border border-destructive/20 text-red-500">
					<AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
					<div className="text-sm">
						<p className="font-medium mb-1">Warning: This cannot be undone</p>
						<p>
							Deleting this file will permanently remove all associated data
							including:
						</p>
						<ul className="list-disc pl-5 mt-2 space-y-1">
							<li>All chunks for this file</li>
							<li>All embeddings for this file</li>
							<li>All metadata for this file</li>
						</ul>
					</div>
				</div>

				{errorMessage && (
					<div className="p-3 bg-destructive/10 border border-destructive text-destructive rounded-md text-sm">
						{errorMessage}
					</div>
				)}

				<div className="flex justify-end gap-2 mt-2">
					<Button
						variant="outline"
						onClick={() => setOpenDelete(false)}
						disabled={isDeleting}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={isDeleting}
					>
						{isDeleting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Deleting...
							</>
						) : (
							"Delete File"
						)}
					</Button>
				</div>
			</div>
		</ResponsiveDialog>
	);
};

export default DeleteFile;
