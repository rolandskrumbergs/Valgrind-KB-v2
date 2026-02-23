"use client";

import { useKnowledgeBaseAllStatus } from "@/hooks/knowledge-base/use-knowledge-base-all-status";
import React, { useMemo } from "react";

const ProcessingStatusBadge = () => {
	const { knowledgeBaseStatus } = useKnowledgeBaseAllStatus();

	// Determine if we're currently showing any files that are being processed
	const hasVisibleProcessingFiles = useMemo(() => {
		return knowledgeBaseStatus.some(
			(file) =>
				file.processingStatus !== "completed" &&
				file.processingStatus !== "failed",
		);
	}, [knowledgeBaseStatus]);

	const processingFilesCount = useMemo(() => {
		return knowledgeBaseStatus.filter(
			(file) =>
				file.processingStatus !== "completed" &&
				file.processingStatus !== "failed",
		).length;
	}, [knowledgeBaseStatus]);

	if (hasVisibleProcessingFiles) {
		return (
			<div className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-yellow-500/60 text-white">
				Processing {processingFilesCount} document
				{processingFilesCount !== 1 ? "s" : ""}
			</div>
		);
	}

	return null;
};

export default ProcessingStatusBadge;
