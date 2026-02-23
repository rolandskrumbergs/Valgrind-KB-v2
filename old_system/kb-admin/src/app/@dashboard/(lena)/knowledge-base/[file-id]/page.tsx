import { getKnowledgeBaseFileByIdAction } from "@/actions/knowledge-actions";
import React from "react";
import {
	File,
	Calendar,
	User,
	Database,
	AlertCircle,
	ArrowLeft,
	Play,
} from "lucide-react";
import { formatFileSize } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import DeleteFile from "@/components/knowledge-base/delete-file";

// Define types for the JSON structures
type ChunkMetrics = {
	avgSize?: number;
	maxSize?: number;
	minSize?: number;
	totalChunks?: number;
	chunkingConfig?: Record<string, unknown>;
	// For snake_case variants
	avg_size?: number;
	max_size?: number;
	min_size?: number;
	total_chunks?: number;
	chunking_config?: Record<string, unknown>;
};

type ProcessingTime = {
	download?: number;
	partition?: number;
	clean?: number;
	chunk?: number;
	embed?: number;
	index?: number;
	total?: number;
};

type ChunkSample = {
	text: string;
	type: string;
	size: number;
	embedding_dimension?: number;
	embedding_model?: string;
};

type EmbeddingResults = {
	totalEmbedded?: number;
	embeddingModel?: string;
	embeddingDimension?: number;
	chunksSample?: ChunkSample[];
	// For snake_case variants
	total_embedded?: number;
	embedding_model?: string;
	embedding_dimension?: number;
	chunks_sample?: ChunkSample[];
};

const KnowledgeBaseFilePage = async ({
	params,
}: {
	params: Promise<{ "file-id": string }>;
}) => {
	const resolvedParams = await params;
	const fileId = resolvedParams["file-id"];

	const knowledgeBaseFile = await getKnowledgeBaseFileByIdAction(fileId);

	if ("error" in knowledgeBaseFile) {
		return (
			<div className="h-full w-full bg-background rounded-lg p-4 flex items-center gap-2 text-red-500">
				<AlertCircle className="h-5 w-5" />
				<span>Error: {knowledgeBaseFile.error}</span>
			</div>
		);
	}

	// Helper function to parse JSON safely
	const parseJsonSafely = <T,>(value: unknown): T | null => {
		if (typeof value === "string") {
			try {
				return JSON.parse(value) as T;
			} catch (error) {
				console.error("Failed to parse JSON:", error);
				return null;
			}
		}
		return value as T;
	};

	// Parse JSON data
	const chunkMetrics = parseJsonSafely<ChunkMetrics>(
		knowledgeBaseFile.chunkMetrics,
	);
	const processingTime = parseJsonSafely<ProcessingTime>(
		knowledgeBaseFile.processingTime,
	);
	const embeddingResults = parseJsonSafely<EmbeddingResults>(
		knowledgeBaseFile.embeddingResults,
	);

	return (
		<div className="h-full w-full bg-muted rounded-lg flex flex-col">
			{/* Header with back button - fixed at top */}
			<div className="flex items-center justify-between h-20 px-6 border-b">
				<div className="flex items-start flex-col">
					<div className="flex items-center gap-2">
						<Link
							href="/knowledge-base"
							className="text-muted-foreground hover:text-foreground mr-2"
						>
							<ArrowLeft className="h-4 w-4" />
						</Link>
						<h1 className="text-xl font-semibold">
							{knowledgeBaseFile.fileName}
						</h1>
					</div>
					<p className="text-sm text-muted-foreground mt-1">
						{knowledgeBaseFile.category} • {knowledgeBaseFile.fileType} •{" "}
						{formatFileSize(knowledgeBaseFile.fileSize)}
					</p>
				</div>
				<div className="flex flex-row gap-2 items-center">
					{knowledgeBaseFile.processingStatus === "completed" && (
						<div className="flex-shrink-0 flex flex-row gap-2 items-center text-xs py-0.5 rounded-md  pl-2 pr-1 bg-emerald-500/60">
							Active
							<Play className="h-3 w-3 text-white" fill="currentColor" />
						</div>
					)}
					<DeleteFile knowledgeBaseFile={knowledgeBaseFile} />
				</div>
			</div>

			{/* Scrollable content */}
			<ScrollArea className="h-[calc(100vh-10rem)]">
				<div className="px-2 py-6 space-y-2 max-w-6xl mx-auto">
					{/* Top Info Cards */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
						<div className="rounded-md bg-muted-foreground/10 overflow-hidden border shadow-sm h-full">
							<div className="bg-muted-foreground/20 p-4 border-b border-muted">
								<h2 className="text-sm font-medium flex items-center gap-2">
									<Calendar className="h-4 w-4" />
									File Information
								</h2>
							</div>
							<div className="flex flex-col p-4 divide-y divide-muted">
								<div className="flex items-center py-2">
									<div className="text-sm text-muted-foreground w-1/3">
										Uploaded
									</div>
									<div className="text-sm w-2/3">
										{new Date(knowledgeBaseFile.uploadedAt).toLocaleString()}
									</div>
								</div>
								<div className="flex items-center py-2">
									<div className="text-sm text-muted-foreground w-1/3">
										Status
									</div>
									<div className="text-sm capitalize w-2/3">
										{knowledgeBaseFile.processingStatus}
									</div>
								</div>
							</div>
						</div>

						<div className="rounded-md border bg-muted-foreground/10 overflow-hidden shadow-sm h-full">
							<div className="bg-muted-foreground/20 p-4 border-b border-muted">
								<h2 className="text-sm font-medium flex items-center gap-2">
									<User className="h-4 w-4" />
									Upload Information
								</h2>
							</div>
							<div className="flex flex-col p-4 divide-y divide-muted">
								<div className="flex items-center py-2">
									<div className="text-sm text-muted-foreground w-1/3">
										Uploaded By
									</div>
									<div className="text-sm w-2/3">
										{knowledgeBaseFile.userName || "Unknown"}
									</div>
								</div>
								<div className="flex items-center py-2">
									<div className="text-sm text-muted-foreground w-1/3">
										User Role
									</div>
									<div className="text-sm w-2/3">
										{knowledgeBaseFile.userRole || "Unknown"}
									</div>
								</div>
							</div>
						</div>
					</div>

					{knowledgeBaseFile.processingStatus === "completed" && (
						<>
							{processingTime && (
								<div className="rounded-md border bg-muted-foreground/10 overflow-hidden shadow-sm">
									<div className="bg-muted-foreground/20 p-4 border-b border-muted">
										<h2 className="text-sm font-medium flex items-center gap-2">
											<Calendar className="h-4 w-4" />
											Processing Time (seconds)
										</h2>
									</div>
									<div className="p-4">
										<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
											{Object.entries(processingTime).map(([key, value]) => (
												<div
													key={key}
													className="flex flex-col items-center p-3 rounded-md bg-muted-foreground/10 "
												>
													<div className="text-xs text-muted-foreground capitalize mb-1">
														{key}
													</div>
													<div className="font-medium">
														{typeof value === "number"
															? value.toFixed(2)
															: String(value ?? 0)}
													</div>
												</div>
											))}
										</div>
									</div>
								</div>
							)}

							<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
								{/* Chunks Information */}
								<div className="rounded-md border bg-muted-foreground/10 overflow-hidden shadow-sm">
									<div className="bg-muted-foreground/20 p-4 border-b border-muted">
										<h2 className="text-sm font-medium flex items-center gap-2">
											<Database className="h-4 w-4" />
											Chunks Information
										</h2>
									</div>
									<div className="p-4">
										<div className="flex flex-col divide-y divide-muted">
											<div className="flex items-center py-2">
												<div className="text-sm text-muted-foreground w-1/2">
													Total Chunks:
												</div>
												<div className="text-sm w-1/2 font-medium">
													{knowledgeBaseFile.totalChunks || 0}
												</div>
											</div>
											<div className="flex items-center py-2">
												<div className="text-sm text-muted-foreground w-1/2">
													Indexed Chunks:
												</div>
												<div className="text-sm w-1/2 font-medium">
													{knowledgeBaseFile.totalIndexedChunks || 0}
												</div>
											</div>
											<div className="flex items-center py-2">
												<div className="text-sm text-muted-foreground w-1/2">
													Failed Chunks:
												</div>
												<div className="text-sm w-1/2 font-medium">
													{knowledgeBaseFile.totalFailedChunks || 0}
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* Chunk Metrics */}
								{chunkMetrics && (
									<div className="rounded-md border bg-muted-foreground/10 overflow-hidden shadow-sm">
										<div className="bg-muted-foreground/20 p-4 border-b border-muted">
											<h2 className="text-sm font-medium flex items-center gap-2">
												<Database className="h-4 w-4" />
												Chunk Metrics
											</h2>
										</div>
										<div className="p-4">
											<div className="flex flex-col divide-y divide-muted">
												<div className="flex items-center py-2">
													<div className="text-sm text-muted-foreground w-1/2">
														Average Size:
													</div>
													<div className="text-sm w-1/2 font-medium">
														{(
															(chunkMetrics.avgSize ?? chunkMetrics.avg_size) ||
															0
														).toFixed(2)}
													</div>
												</div>
												<div className="flex items-center py-2">
													<div className="text-sm text-muted-foreground w-1/2">
														Max Size:
													</div>
													<div className="text-sm w-1/2 font-medium">
														{chunkMetrics.maxSize ?? chunkMetrics.max_size ?? 0}
													</div>
												</div>
												<div className="flex items-center py-2">
													<div className="text-sm text-muted-foreground w-1/2">
														Min Size:
													</div>
													<div className="text-sm w-1/2 font-medium">
														{chunkMetrics.minSize ?? chunkMetrics.min_size ?? 0}
													</div>
												</div>
												<div className="flex items-center py-2">
													<div className="text-sm text-muted-foreground w-1/2">
														Total Chunks:
													</div>
													<div className="text-sm w-1/2 font-medium">
														{chunkMetrics.totalChunks ??
															chunkMetrics.total_chunks ??
															0}
													</div>
												</div>
											</div>
										</div>
									</div>
								)}

								{/* Chunking Configuration */}
								{chunkMetrics &&
									(chunkMetrics.chunkingConfig ||
										chunkMetrics.chunking_config) && (
										<div className="rounded-md border bg-muted-foreground/10 overflow-hidden shadow-sm">
											<div className="bg-muted-foreground/20 p-4 border-b border-muted">
												<h2 className="text-sm font-medium flex items-center gap-2">
													<File className="h-4 w-4" />
													Chunking Configuration
												</h2>
											</div>
											<div className="p-4">
												<div className="flex flex-col divide-y divide-muted">
													{Object.entries(
														chunkMetrics.chunkingConfig ||
															chunkMetrics.chunking_config ||
															{},
													).map(([key, value]) => (
														<div className="flex items-center py-2" key={key}>
															<div className="text-sm text-muted-foreground w-1/2 capitalize">
																{key.replace(/_/g, " ")}:
															</div>
															<div className="text-sm w-1/2 font-medium">
																{typeof value === "object"
																	? JSON.stringify(value)
																	: String(value)}
															</div>
														</div>
													))}
												</div>
											</div>
										</div>
									)}

								{/* Embedding Results */}
								{embeddingResults && (
									<div className="rounded-md border bg-muted-foreground/10 overflow-hidden shadow-sm">
										<div className="bg-muted-foreground/20 p-4 border-b border-muted">
											<h2 className="text-sm font-medium flex items-center gap-2">
												<Database className="h-4 w-4" />
												Embedding Results
											</h2>
										</div>
										<div className="p-4">
											<div className="flex flex-col divide-y divide-muted">
												<div className="flex items-center py-2">
													<div className="text-sm text-muted-foreground w-1/2">
														Total Embedded
													</div>
													<div className="text-sm w-1/2 font-medium">
														{embeddingResults.totalEmbedded ??
															embeddingResults.total_embedded ??
															0}
													</div>
												</div>
												<div className="flex items-center py-2">
													<div className="text-sm text-muted-foreground w-1/2">
														Embedding Model
													</div>
													<div className="text-sm w-1/2 font-mono ">
														{embeddingResults.embeddingModel ??
															embeddingResults.embedding_model ??
															"Unknown"}
													</div>
												</div>
												<div className="flex items-center py-2">
													<div className="text-sm text-muted-foreground w-1/2">
														Embedding Dimension
													</div>
													<div className="text-sm w-1/2 font-medium">
														{embeddingResults.embeddingDimension ??
															embeddingResults.embedding_dimension ??
															0}
													</div>
												</div>
											</div>
										</div>
									</div>
								)}
							</div>

							{(() => {
								const chunks =
									embeddingResults?.chunksSample ??
									embeddingResults?.chunks_sample;
								if (!chunks || chunks.length === 0) return null;

								return (
									<div className="rounded-md border bg-muted-foreground/10 overflow-hidden shadow-sm">
										<div className="bg-muted-foreground/20 p-4 border-b border-muted">
											<h2 className="text-sm font-medium flex items-center gap-2">
												<File className="h-4 w-4" />
												Sample Chunks
											</h2>
										</div>
										<div className="divide-y divide-border">
											{chunks.map((chunk, index: number) => (
												<div
													key={`chunk-${chunk.text.substring(0, 20)}-${index}`}
													className="p-4"
												>
													<div className="flex flex-wrap gap-4 mb-3">
														<div className="flex items-center">
															<span className="text-sm text-muted-foreground mr-2">
																Type:
															</span>
															<span className="text-sm font-medium px-2 py-1 bg-muted-foreground/10 rounded">
																{chunk.type}
															</span>
														</div>
														<div className="flex items-center">
															<span className="text-sm text-muted-foreground mr-2">
																Size:
															</span>
															<span className="text-sm font-medium px-2 py-1 bg-muted-foreground/10 rounded">
																{chunk.size} characters
															</span>
														</div>
													</div>
													<div className="p-3 bg-muted-foreground/10 rounded-md">
														<div className="text-xs overflow-auto max-h-46 text-muted-foreground font-mono whitespace-pre-wrap break-all overflow-x-hidden">
															{chunk.text}
														</div>
													</div>
												</div>
											))}
										</div>
									</div>
								);
							})()}
						</>
					)}

					{knowledgeBaseFile.processingStatus === "failed" &&
						knowledgeBaseFile.errorMessage && (
							<div className="rounded-md border border-red-300 bg-muted-foreground/10 overflow-hidden shadow-sm">
								<div className="bg-red-500/10 p-4 border-b border-red-300">
									<h2 className="text-sm font-medium flex items-center gap-2 text-red-500">
										<AlertCircle className="h-4 w-4" />
										Error Information
									</h2>
								</div>
								<div className="p-4">
									<div className="p-3 bg-red-50 text-red-800 rounded-md text-sm">
										{knowledgeBaseFile.errorMessage}
									</div>
								</div>
							</div>
						)}
				</div>
				<div className="bg-gradient-to-b from-muted to-transparent h-8 absolute top-0 w-full" />
				<div className="bg-gradient-to-t from-muted to-transparent h-10 absolute bottom-0 w-full rounded-b-lg" />
			</ScrollArea>
		</div>
	);
};

export default KnowledgeBaseFilePage;
