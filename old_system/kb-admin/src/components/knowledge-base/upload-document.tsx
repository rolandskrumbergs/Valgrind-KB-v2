"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
	File as FileIcon,
	X,
	Check,
	AlertCircle,
	Loader2,
	Upload,
	Info,
	Plus,
} from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { uploadDocumentToS3 } from "@/actions/knowledge-actions";
import type { UploadResult } from "@/actions/knowledge-actions";
import { toast } from "sonner";
import { mutate } from "swr";
import {
	KNOWLEDGE_BASE_LITE_CACHE_KEY,
	KNOWLEDGE_BASE_ALL_STATUS_CACHE_KEY,
} from "@/constants/cache-keys";
import ChunkSettings from "./chunk-settings";
import type { FileRejection } from "react-dropzone";

type DocumentCategory = "books" | "laws" | "legalcases" | "other";

interface DocumentFile {
	file: globalThis.File;
	category?: DocumentCategory;
	chunkSet?: string;
	uploadStatus?: "idle" | "uploading" | "success" | "error" | "duplicate";
	uploadProgress?: number;
	uploadResult?: UploadResult;
	fileHash?: string;
}

const ACCEPTED_FILE_TYPES = {
	"application/msword": [".doc"],
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
		".docx",
	],
	"application/pdf": [".pdf"],
	"text/plain": [".txt"],
};

// Maximum file size: 4MB
const MAX_FILE_SIZE = 4 * 1024 * 1024;

const getFileExtension = (fileName: string) => {
	const extension = fileName.split(".").pop()?.toUpperCase();
	return extension || "";
};

const UploadDocument = () => {
	const [files, setFiles] = useState<DocumentFile[]>([]);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [fileSizeError, setFileSizeError] = useState<string | null>(null);

	// Reset upload progress when dialog is closed
	useEffect(() => {
		if (!dialogOpen) {
			// Remove any successfully uploaded files from state
			setFiles((prev) =>
				prev.filter(
					(file) =>
						file.uploadStatus !== "success" &&
						file.uploadStatus !== "duplicate",
				),
			);
		}
	}, [dialogOpen]);

	const onDrop = useCallback(
		(acceptedFiles: globalThis.File[], rejectedFiles: FileRejection[]) => {
			// Check for files that exceed size limit
			const oversizedFiles = rejectedFiles
				.filter((rejection) =>
					rejection.errors.some((error) => error.code === "file-too-large"),
				)
				.map((rejection) => rejection.file.name);

			if (oversizedFiles.length > 0) {
				setFileSizeError(
					`${oversizedFiles.length > 1 ? "Files" : "File"} exceeding 4MB limit: ${oversizedFiles.join(", ")}`,
				);
				setTimeout(() => setFileSizeError(null), 5000);
			}

			setFiles((prev) => {
				const newFiles = acceptedFiles.map((file) => {
					// Check for file size
					if (file.size > MAX_FILE_SIZE) {
						return {
							file,
							uploadStatus: "error" as const,
							uploadProgress: 0,
						};
					}

					// Check if we have a file with the same name, size, and upload date already in our list
					const existingFile = prev.find(
						(existingFile) =>
							existingFile.file.name === file.name &&
							existingFile.file.size === file.size &&
							existingFile.file.lastModified === file.lastModified,
					);

					// If we already have this file, mark it as a duplicate
					if (existingFile) {
						return {
							file,
							uploadStatus: "duplicate" as const,
							uploadProgress: 0,
						};
					}

					return {
						file,
						uploadStatus: "idle" as const,
						uploadProgress: 0,
					};
				});

				const uniqueFiles = newFiles.filter(
					(newFile) =>
						!prev.some(
							(existingFile) =>
								existingFile.file.name === newFile.file.name &&
								existingFile.file.size === newFile.file.size &&
								existingFile.file.lastModified === newFile.file.lastModified,
						),
				);
				return [...prev, ...uniqueFiles];
			});
			setDialogOpen(true);
		},
		[],
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: ACCEPTED_FILE_TYPES,
		maxSize: MAX_FILE_SIZE,
	});

	const removeFile = (fileToRemove: DocumentFile) => {
		setFiles((prev) => prev.filter((f) => f.file !== fileToRemove.file));
	};

	const updateFileCategory = (
		file: DocumentFile,
		category: DocumentCategory,
	) => {
		setFiles((prev) =>
			prev.map((f) => (f.file === file.file ? { ...f, category } : f)),
		);
	};

	const updateFileChunkSet = (file: DocumentFile, chunkSet: string) => {
		setFiles((prev) =>
			prev.map((f) => (f.file === file.file ? { ...f, chunkSet } : f)),
		);
	};

	const handleUpload = async () => {
		// Get files that have a category
		const filesToUpload = files.filter(
			(f) =>
				f.category &&
				f.uploadStatus !== "duplicate" &&
				f.uploadStatus !== "success",
		);

		if (filesToUpload.length === 0) {
			toast.error("Please add at least one file with a category to upload.");
			return;
		}

		setIsUploading(true);

		let successCount = 0;
		let errorCount = 0;
		let duplicateCount = 0;
		let configError = false;
		let authError = false;
		const successfullyUploadedFiles: DocumentFile[] = [];

		// Update status of files that will be uploaded
		setFiles((prev) =>
			prev.map((f) => {
				if (filesToUpload.some((upFile) => upFile.file === f.file)) {
					return { ...f, uploadStatus: "uploading", uploadProgress: 0 };
				}
				return f;
			}),
		);

		// Upload each file
		for (let i = 0; i < filesToUpload.length; i++) {
			const fileDoc = filesToUpload[i];

			try {
				// Update this file's status to uploading
				setFiles((prev) =>
					prev.map((f) =>
						f.file === fileDoc.file
							? { ...f, uploadStatus: "uploading", uploadProgress: 10 }
							: f,
					),
				);

				// Create FormData for server action
				const formData = new FormData();
				formData.append("file", fileDoc.file);
				formData.append("category", fileDoc.category as string);
				formData.append("chunkSet", fileDoc.chunkSet || "set_a");

				// Call server action to upload file
				const result = await uploadDocumentToS3(formData);

				// If the file was already in S3 (duplicate)
				if (result.alreadyExists) {
					setFiles((prev) =>
						prev.map((f) =>
							f.file === fileDoc.file
								? {
										...f,
										uploadStatus: "duplicate",
										uploadProgress: 100,
										uploadResult: result,
										fileHash: result.fileHash,
									}
								: f,
						),
					);
					duplicateCount++;
				} else {
					// Update progress to 100% immediately since server actions don't support progress
					setFiles((prev) =>
						prev.map((f) =>
							f.file === fileDoc.file ? { ...f, uploadProgress: 100 } : f,
						),
					);

					// Update this file's status to success
					setFiles((prev) =>
						prev.map((f) =>
							f.file === fileDoc.file
								? {
										...f,
										uploadStatus: "success",
										uploadProgress: 100,
										uploadResult: result,
										fileHash: result.fileHash,
									}
								: f,
						),
					);

					// Add to successfully uploaded files list
					successfullyUploadedFiles.push(fileDoc);
					successCount++;
				}

				mutate(KNOWLEDGE_BASE_LITE_CACHE_KEY);
				mutate(KNOWLEDGE_BASE_ALL_STATUS_CACHE_KEY);
			} catch (error) {
				console.error(`Error uploading ${fileDoc.file.name}:`, error);

				// Check for specific error types
				if (error instanceof Error) {
					if (error.message.includes("environment variable is not set")) {
						configError = true;
						// If it's a config error, we should stop trying to upload more files
						break;
					}

					if (error.message.includes("Unauthorized")) {
						authError = true;
						// If it's an auth error, we should stop trying to upload more files
						break;
					}

					if (error.message.includes("File size exceeds limit")) {
						// Update this file's status to error with specific message for size limit
						setFiles((prev) =>
							prev.map((f) =>
								f.file === fileDoc.file
									? { ...f, uploadStatus: "error", uploadProgress: 0 }
									: f,
							),
						);

						// Show specific toast for this file
						toast.error(`${fileDoc.file.name}: ${error.message}`);
						errorCount++;
						continue;
					}
				}

				// Update this file's status to error
				setFiles((prev) =>
					prev.map((f) =>
						f.file === fileDoc.file
							? { ...f, uploadStatus: "error", uploadProgress: 0 }
							: f,
					),
				);

				errorCount++;
			}
		}

		setIsUploading(false);

		// Show toast with results
		if (authError) {
			toast.error(
				"You are not authorized to upload documents. Only admins and managers can upload files.",
				{
					duration: 5000,
				},
			);
		} else if (configError) {
			toast.error(
				"AWS configuration error. Please make sure AWS_BUCKET_NAME, APP_AWS_ACCESS_KEY, and AWS_SECRET_ACCESS_KEY are set in your environment variables.",
				{
					duration: 6000,
				},
			);
		} else if (successCount > 0 && duplicateCount === 0 && errorCount === 0) {
			toast.success(
				`Successfully uploaded ${successCount} file${
					successCount !== 1 ? "s" : ""
				} to the knowledge base.`,
			);
			// Close dialog when all files are successfully uploaded
			setDialogOpen(false);
		} else if (duplicateCount > 0) {
			if (successCount > 0 && errorCount === 0) {
				toast.success(
					`Uploaded ${successCount} file${
						successCount !== 1 ? "s" : ""
					} and detected ${duplicateCount} duplicate${
						duplicateCount !== 1 ? "s" : ""
					}.`,
				);
				// Close dialog when all files are successfully uploaded or duplicates
				setDialogOpen(false);
			} else if (successCount > 0 && errorCount > 0) {
				toast.error(
					`Uploaded ${successCount} file${
						successCount !== 1 ? "s" : ""
					}, detected ${duplicateCount} duplicate${
						duplicateCount !== 1 ? "s" : ""
					}, but ${errorCount} file${errorCount !== 1 ? "s" : ""} failed.`,
				);
			} else if (successCount === 0 && errorCount === 0) {
				toast.info(
					`All ${duplicateCount} file${
						duplicateCount !== 1 ? "s" : ""
					} were already uploaded.`,
				);
				// Close dialog when all files were already uploaded (all duplicates)
				setDialogOpen(false);
			}
		} else if (successCount > 0 && errorCount > 0) {
			toast.error(
				`Uploaded ${successCount} file${
					successCount !== 1 ? "s" : ""
				} successfully, but ${errorCount} file${
					errorCount !== 1 ? "s" : ""
				} failed. Please try again.`,
			);
		} else {
			toast.error(
				`Failed to upload ${errorCount} file${
					errorCount !== 1 ? "s" : ""
				}. Please check your connection and try again.`,
			);
		}
	};

	const totalFilesCount = files.length;
	const uncategorizedFilesCount = files.filter((f) => !f.category).length;
	const duplicateFilesCount = files.filter(
		(f) => f.uploadStatus === "duplicate",
	).length;
	const filesToUpload = files.filter(
		(f) =>
			f.category &&
			f.uploadStatus !== "duplicate" &&
			f.uploadStatus !== "success",
	);

	return (
		<div className="w-full bg-muted rounded-lg p-4 flex flex-col">
			<div className="flex flex-col px-1 gap-4 w-full">
				<div className="flex justify-between w-full flex-col">
					<h1 className="text-xl font-semibold">Add Documents</h1>
					<p className="text-sm text-muted-foreground">
						Add documents to the knowledge base for Lena AI
					</p>
				</div>
				<Button
					variant="default"
					size="lg"
					onClick={() => setDialogOpen(true)}
					className="flex items-center gap-2 w-full"
				>
					<Plus className="w-4 h-4" />
					<span>Upload Files {files.length > 0 && `(${files.length})`}</span>
				</Button>
			</div>

			<ResponsiveDialog
				open={dialogOpen}
				onOpenChange={(open) => {
					if (!isUploading) {
						setDialogOpen(open);
					}
				}}
				title="Document Upload"
				description="Review and categorize your documents before uploading"
				trigger={null}
				className="sm:max-w-3xl"
			>
				<div className="flex flex-col">
					<div className="p-4">
						<div
							{...getRootProps()}
							className={cn(
								"border-2 border-dashed rounded-lg bg-muted-foreground/10 text-center cursor-pointer transition-colors h-fit p-4 flex flex-col items-center justify-center",
								isDragActive
									? "border-primary bg-primary/5"
									: "border-muted-foreground/25 hover:border-primary/50",
							)}
						>
							<input {...getInputProps()} />
							<p className="font-medium text-sm mb-2">
								{isDragActive
									? "Drop the files here"
									: "Drag & drop files here, or click to select files"}
							</p>
							<p className="text-xs text-muted-foreground">
								Accepted files: .doc, .docx, .pdf, .txt
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								<span className="font-medium">Maximum file size: 4MB</span>
							</p>
							{fileSizeError && (
								<p className="text-xs text-destructive mt-2 max-w-full overflow-hidden text-ellipsis">
									{fileSizeError}
								</p>
							)}
						</div>
					</div>

					{files.length > 0 && (
						<div className="flex flex-col gap-2">
							<div className="flex flex-col px-4">
								<p className="text-sm text-muted-foreground">
									Choose the category for each document before uploading.
								</p>
							</div>
							<ScrollArea className="max-h-[60vh]">
								<div className="flex flex-col gap-4 px-4 py-8">
									{files.map((doc) => (
										<div
											key={`${doc.file.name}-${doc.file.size}`}
											className={cn(
												"flex items-center gap-4 flex-col w-full justify-between px-2 py-3 rounded-lg relative",
												doc.uploadStatus === "duplicate"
													? "bg-amber-500/20 border border-amber-500/20"
													: doc.uploadStatus === "error"
														? "bg-destructive/40 border border-destructive/40"
														: "bg-muted-foreground/8 border border-muted-foreground/10",
											)}
										>
											<div className="flex items-center gap-2 w-full">
												<div className="flex items-center gap-3 ml-1">
													{doc.uploadStatus === "success" ? (
														<Check className="w-5 h-5 text-emerald-500" />
													) : doc.uploadStatus === "duplicate" ? (
														<Info className="w-5 h-5 text-amber-500" />
													) : doc.uploadStatus === "uploading" ? (
														<Loader2 className="w-5 h-5 animate-spin" />
													) : !doc.category ? (
														<AlertCircle className="w-5 h-5 text-yellow-500" />
													) : (
														<FileIcon className="w-5 h-5" />
													)}
												</div>
												<div className="flex flex-col gap-0.5">
													<span className="text-sm font-medium">
														{doc.file.name}
													</span>
													<span className="text-xs text-muted-foreground">
														{formatFileSize(doc.file.size)} •{" "}
														{getFileExtension(doc.file.name)}
														{doc.uploadStatus === "uploading" &&
														doc.uploadProgress
															? ` • Uploading ${doc.uploadProgress}%`
															: ""}
														{doc.uploadStatus === "success" && (
															<span className="text-xs inline-block text-muted bg-emerald-500 px-1 ml-2 rounded items-center whitespace-nowrap">
																File uploaded
															</span>
														)}
														{doc.uploadStatus === "duplicate" && (
															<span className="text-xs inline-block text-muted bg-amber-500/80 px-1 ml-2 rounded items-center whitespace-nowrap">
																This file already exists in the knowledge base
															</span>
														)}
														{doc.uploadStatus === "error" && " • Failed"}
													</span>
												</div>
											</div>
											<div className="flex items-center gap-2 w-full justify-between">
												<div className="flex items-center gap-2">
													<div
														className={cn(
															"text-xs  text-muted-foreground p-1.5 rounded-lg flex items-center leading-none whitespace-nowrap text-center",
															!doc.category &&
																doc.uploadStatus !== "duplicate" &&
																doc.uploadStatus !== "error" &&
																"text-yellow-500",
														)}
													>
														Choose <br /> category
													</div>
													<Select
														value={doc.category}
														onValueChange={(value: DocumentCategory) =>
															updateFileCategory(doc, value)
														}
														disabled={
															isUploading ||
															doc.uploadStatus === "uploading" ||
															doc.uploadStatus === "success" ||
															doc.uploadStatus === "duplicate"
														}
													>
														<SelectTrigger className="w-fit  data-[placeholder]:text-white [&_svg:not([class*='text-'])]:text-white cursor-pointer bg-background">
															<SelectValue placeholder="Category" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="books">Books</SelectItem>
															<SelectItem value="laws">Laws</SelectItem>
															<SelectItem value="legalcases">
																Legal Cases
															</SelectItem>
															<SelectItem value="other">Other</SelectItem>
														</SelectContent>
													</Select>
												</div>
												<div className="flex items-center gap-2">
													<div className="text-xs  text-muted-foreground p-1.5 rounded-lg flex items-center leading-none whitespace-nowrap text-center">
														Chunking <br /> Setting
													</div>
													<ChunkSettings
														value={doc.chunkSet || "set_a"}
														onChange={(value) => updateFileChunkSet(doc, value)}
														disabled={
															isUploading ||
															doc.uploadStatus === "uploading" ||
															doc.uploadStatus === "success" ||
															doc.uploadStatus === "duplicate"
														}
													/>
												</div>
											</div>
											<button
												type="button"
												onClick={() => removeFile(doc)}
												className="p-1  rounded-full cursor-pointer absolute right-2 top-2"
												disabled={
													isUploading || doc.uploadStatus === "uploading"
												}
											>
												<X className="w-4 h-4 text-muted-foreground hover:text-red-500/50" />
											</button>
										</div>
									))}
								</div>
								<div className="bg-gradient-to-b from-alert-dialog to-transparent h-6 absolute top-0 w-full" />
								<div className="bg-gradient-to-t from-alert-dialog to-transparent h-6 absolute bottom-0 w-full" />
							</ScrollArea>
						</div>
					)}

					<div className="flex justify-between gap-2 p-4  items-center">
						<div className="flex gap-2 items-center">
							{filesToUpload.length !== totalFilesCount && (
								<div className="text-xs p-2 rounded-lg text-muted-foreground border bg-muted-foreground/10 border-muted-foreground/20">
									{totalFilesCount} file{totalFilesCount !== 1 ? "s" : ""}{" "}
									selected
								</div>
							)}
							<div className="text-xs p-2 rounded-lg text-muted-foreground border bg-muted-foreground/10 border-muted-foreground/20">
								{uncategorizedFilesCount > 0 ? (
									<>
										{uncategorizedFilesCount} file
										{uncategorizedFilesCount !== 1 ? "s" : ""} need
										{uncategorizedFilesCount !== 1 ? "" : "s"} categorization
									</>
								) : (
									<>
										{filesToUpload.length}{" "}
										{filesToUpload.length !== 1 ? "files" : "file"} ready to
										upload
									</>
								)}
								{duplicateFilesCount > 0 &&
									` • ${duplicateFilesCount} duplicate${duplicateFilesCount !== 1 ? "s" : ""} detected`}
							</div>
						</div>

						<div className="flex gap-2 items-center">
							<Button
								variant="outline"
								onClick={() => setDialogOpen(false)}
								disabled={isUploading}
							>
								Close
							</Button>
							<Button
								disabled={
									uncategorizedFilesCount > 0 ||
									isUploading ||
									filesToUpload.length === 0
								}
								onClick={handleUpload}
								className="gap-2"
							>
								{isUploading ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin" />
										Uploading...
									</>
								) : (
									<>
										<Upload className="w-4 h-4" />
										Upload Files
									</>
								)}
							</Button>
						</div>
					</div>
				</div>
			</ResponsiveDialog>
		</div>
	);
};

export default UploadDocument;
