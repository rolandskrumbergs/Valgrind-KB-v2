"use client";

import { useKnowledgeBaseFileStatus } from "@/hooks/knowledge-base/use-knowledge-base-file-status";
import React from "react";
import {
	Loader2,
	Check,
	AlertCircle,
	Database,
	FileText,
	Workflow,
	Cpu,
	Server,
	Play,
} from "lucide-react";
// Processing step config with icons and descriptions
const PROCESSING_STEPS = [
	{ status: "uploaded", icon: FileText, label: "Queued" },
	{ status: "downloading", icon: FileText, label: "Downloading" },
	{ status: "partitioning", icon: FileText, label: "Partitioning" },
	{ status: "cleaning", icon: Workflow, label: "Cleaning" },
	{ status: "chunking", icon: Database, label: "Chunking" },
	{ status: "embedding", icon: Cpu, label: "Embedding" },
	{ status: "indexing", icon: Server, label: "Indexing" },
	{ status: "completed", icon: Check, label: "Completed" },
];

const FileStatus = ({ fileId }: { fileId: string }) => {
	const {
		file: fullFile,
		isProcessing,
		hasFailed,
		currentStepIndex,
		progressPercentage,
	} = useKnowledgeBaseFileStatus(fileId);

	return (
		<div>
			{isProcessing ? (
				<div className="flex flex-row gap-2">
					<div className="flex-shrink-0 flex flex-row gap-2 items-center text-xs py-0.5 rounded-md  pl-2 pr-1 bg-yellow-500/60">
						{PROCESSING_STEPS[currentStepIndex]?.label || "Processing"}
						<Loader2 className="h-3 w-3 animate-spin text-white" />
					</div>
					{/* <div
                className={cn(
                    "flex flex-row gap-2 border rounded-md w-fit px-2 text-xs items-center",
                    isProcessing
                        ? "border-yellow-200 bg-yellow-200 text-yellow-800"
                        : hasFailed
                            ? "border-red-200 bg-red-200 text-red-800"
                            : "border-green-200 bg-green-200 text-green-800",
                )}
            >
                <div className="whitespace-nowrap font-medium">
                    {statusMessage}
                </div>
            </div> */}
				</div>
			) : hasFailed ? (
				<div className="flex flex-col gap-2">
					<div className="flex-shrink-0 flex flex-row gap-2 w-fit items-center text-xs py-0.5 rounded-md  pl-2 pr-1 bg-red-500/60">
						<p>Processing Failed</p>
						<AlertCircle className="h-3 w-3 text-white" />
					</div>
					<div className="flex-shrink-0 flex flex-row gap-2 items-center text-xs py-0.5 rounded-md  pl-2 pr-1 bg-red-500/60">
						<p>{fullFile?.errorMessage}</p>
					</div>
				</div>
			) : (
				<div className="flex-shrink-0 flex flex-row gap-2 items-center text-xs py-0.5 rounded-md  pl-2 pr-1 bg-emerald-500/60">
					Active
					<Play className="h-3 w-3 text-white" fill="currentColor" />
				</div>
			)}
			{isProcessing && (
				<div
					className="absolute left-0 bottom-0 top-0 bg-gradient-to-r from-yellow-500/10 via-yellow-500/10 via-90% transition-colors duration-200"
					style={{ width: `${progressPercentage || 0}%` }}
				/>
			)}
		</div>
	);
};

export default FileStatus;
