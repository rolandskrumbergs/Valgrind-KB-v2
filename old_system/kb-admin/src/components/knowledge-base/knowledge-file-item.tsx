import type { KnowledgeBaseFileLite } from "@/hooks/knowledge-base/use-knowledge-base-lite";
import { cn, formatFileSize } from "@/lib/utils";
import { ExternalLink, File, Play } from "lucide-react";
import FileStatus from "./file-status";
import Link from "next/link";

const KnowledgeFileItem = ({
	file,
}: {
	file: KnowledgeBaseFileLite;
}) => {
	return (
		<div className="flex flex-col rounded-md border border-muted-foreground/30 relative w-full overflow-hidden group">
			<div
				className={cn(
					"flex flex-col items-start w-full gap-2 bg-muted-foreground/20 p-2 relative border-b border-muted-foreground/20",
				)}
			>
				{file.processingStatus === "completed" ? (
					<div className="flex-shrink-0 flex flex-row gap-2 items-center text-xs py-0.5 rounded-md  pl-2 pr-1 bg-emerald-500/60">
						Active
						<Play className="h-3 w-3 text-white" fill="currentColor" />
					</div>
				) : (
					<FileStatus fileId={file.id} />
				)}

				<div className="flex flex-row gap-2 items-center">
					<File className="h-4 w-4 text-muted-foreground/80" />

					<Link
						href={`/knowledge-base/${file.id}`}
						className="group-hover:underline"
					>
						<p className="font-medium text-foreground/80 hover:text-primary">
							{file.fileName}
						</p>
					</Link>
				</div>
			</div>

			<div className="flex flex-col md:flex-row md:flex-wrap gap-2 text-sm  p-2 bg-muted-foreground/10">
				<div className="flex w-fit flex-row gap-1 border rounded-md border-muted-foreground/20 px-2 bg-muted-foreground/20 text-muted-foreground text-xs items-center">
					<div className="whitespace-nowrap">{file.fileType}</div>
					<hr className="h-full border-l border-muted-foreground/20" />
					<div className="whitespace-nowrap">
						{formatFileSize(file.fileSize)}
					</div>
				</div>

				<div className="flex w-fit flex-row gap-1 border rounded-md border-muted-foreground/20 px-2 bg-muted-foreground/20 text-muted-foreground text-xs items-center">
					<div className="text-muted-foreground">Category</div>
					<hr className="h-full border-l border-muted-foreground/20" />
					<div className="capitalize font-bold">{file.category}</div>
				</div>

				<div className="flex w-fit flex-row gap-1 border rounded-md border-muted-foreground/20 px-2 bg-muted-foreground/20 text-muted-foreground text-xs items-center">
					<div className="text-muted-foreground">Uploaded</div>
					<hr className="h-full border-l border-muted-foreground/20" />
					<div>{new Date(file.uploadedAt).toLocaleDateString()}</div>
				</div>
				<div className="flex w-fit flex-row gap-1 border rounded-md border-muted-foreground/20 px-2 bg-muted-foreground/20 text-muted-foreground text-xs items-center">
					<div className="text-muted-foreground">Uploaded By</div>
					<hr className="h-full border-l border-muted-foreground/20" />
					<div>{file.userName}</div>
				</div>
			</div>

			{/* View file link */}
			<div className="absolute right-2 top-2 hover:text-primary text-muted-foreground text-xs">
				<a href={file.s3Url} target="_blank" rel="noopener noreferrer">
					<ExternalLink className="h-3 w-3 mr-1" />
				</a>
			</div>
		</div>
	);
};

export default KnowledgeFileItem;
