"use client";

import { cn, formatFileSize } from "@/lib/utils";
import type { AddNewsFormType } from "@/schema";
import { addNewsFormSchema } from "@/schema";
import { ExternalLink, FileText, Upload, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import Tiptap from "./tiptap-editor";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { News } from "@/db/schema";
import ToggleVisibility from "./edit-news-visibility";
import { updateNewsAction } from "@/actions/news-actions";
import { mutate } from "swr";
import { NEWS_CACHE_KEY } from "@/constants/cache-keys";
import { Textarea } from "../ui/textarea";

interface PDFFile {
	file: File;
	preview: string;
	id: string;
	s3Key?: string; // Added to track existing S3 keys
}

const EditNewsForm = ({
	news,
}: {
	news: News;
}) => {
	const [title, setTitle] = useState(news.title);
	const [content, setContent] = useState(news.content);
	const [image, setImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(
		news.featuredImage || null,
	);
	const [imageRemoved, setImageRemoved] = useState(false);
	const [pdfs, setPdfs] = useState<PDFFile[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [excludedCustomers, setExcludedCustomers] = useState<string[]>(
		news.excludedCustomers || [],
	);
	const [hasChanges, setHasChanges] = useState(false);

	// Form validation with zod
	const form = useForm<AddNewsFormType>({
		resolver: zodResolver(addNewsFormSchema),
		defaultValues: {
			title: news.title,
			content: news.content,
		},
	});

	// Initialize PDFs from existing news data
	useEffect(() => {
		if (news.pdfFiles && news.pdfFiles.length > 0) {
			const existingPdfs = news.pdfFiles.map((pdf) => ({
				file: new File([], pdf.fileName), // Create a dummy File object
				preview: pdf.s3Url,
				id: crypto.randomUUID(),
				s3Key: pdf.s3Key, // Store S3 key for existing PDFs
			}));
			setPdfs(existingPdfs);
		}
	}, [news.pdfFiles]);

	// Check for changes in the form
	const checkForChanges = useCallback(() => {
		const titleChanged = title !== news.title;
		const contentChanged = content !== news.content;
		const imageChanged = image !== null;
		const imageRemovedChanged = imageRemoved && news.featuredImage !== null;

		// Check if excluded customers have changed
		const excludedCustomersOriginal = news.excludedCustomers || [];
		const excludedCustomersChanged =
			excludedCustomersOriginal.length !== excludedCustomers.length ||
			excludedCustomersOriginal.some((id) => !excludedCustomers.includes(id)) ||
			excludedCustomers.some((id) => !excludedCustomersOriginal.includes(id));

		// Check if PDFs have changed
		const originalPdfKeys = new Set(
			(news.pdfFiles || []).map((pdf) => pdf.s3Key),
		);
		const currentPdfKeys = new Set(
			pdfs.filter((pdf) => pdf.s3Key).map((pdf) => pdf.s3Key as string),
		);

		// PDFs changed if number is different or any new files added without s3Key
		const pdfsChanged =
			originalPdfKeys.size !== currentPdfKeys.size ||
			pdfs.some((pdf) => !pdf.s3Key) ||
			(news.pdfFiles || []).some((pdf) => !currentPdfKeys.has(pdf.s3Key));

		const anyChanges =
			titleChanged ||
			contentChanged ||
			imageChanged ||
			imageRemovedChanged ||
			excludedCustomersChanged ||
			pdfsChanged;
		setHasChanges(anyChanges);
	}, [title, content, image, imageRemoved, excludedCustomers, pdfs, news]);

	// Check for changes when any state updates
	useEffect(() => {
		checkForChanges();
	}, [checkForChanges]);

	const handleContentChange = (newContent: string) => {
		setContent(newContent);
		form.setValue("content", newContent, {
			shouldValidate: true,
			shouldDirty: true,
		});
	};

	const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newTitle = e.target.value;
		setTitle(newTitle);
		form.setValue("title", newTitle, {
			shouldValidate: true,
			shouldDirty: true,
		});
	};

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file type
		if (file.type !== "image/png" && file.type !== "image/jpeg") {
			toast.error("Please select only PNG or JPEG images");
			return;
		}

		// Validate file size (4MB)
		if (file.size > 4 * 1024 * 1024) {
			toast.error("Image must be less than 4MB");
			return;
		}

		setImage(file);
		setImageRemoved(false);
		const reader = new FileReader();
		reader.onloadend = () => {
			setImagePreview(reader.result as string);
		};
		reader.readAsDataURL(file);
	};

	const handleRemoveImage = () => {
		setImage(null);
		setImagePreview(null);
		setImageRemoved(true);
	};

	const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files) return;

		// Check if adding new files would exceed 3 PDFs limit
		if (pdfs.length + files.length > 3) {
			toast.error("You can only upload up to 3 PDFs");
			return;
		}

		const newPdfs: PDFFile[] = [];

		for (let i = 0; i < files.length; i++) {
			const file = files[i];

			// Validate file type
			if (file.type !== "application/pdf") {
				toast.error(`${file.name} is not a PDF file`);
				continue;
			}

			// Validate file size (4MB)
			if (file.size > 4 * 1024 * 1024) {
				toast.error(`${file.name} must be less than 4MB`);
				continue;
			}

			// Check if file with same name and size already exists
			const isDuplicate = pdfs.some(
				(pdf) => pdf.file.name === file.name && pdf.file.size === file.size,
			);

			if (isDuplicate) {
				toast.error(`${file.name} is already selected`);
				continue;
			}

			newPdfs.push({
				file,
				preview: URL.createObjectURL(file),
				id: crypto.randomUUID(),
			});
		}

		setPdfs([...pdfs, ...newPdfs]);
		e.target.value = ""; // Reset input to allow reuploading
	};

	const handleRemovePdf = (index: number) => {
		const updatedPdfs = [...pdfs];
		URL.revokeObjectURL(updatedPdfs[index].preview); // Clean up object URL
		updatedPdfs.splice(index, 1);
		setPdfs(updatedPdfs);
	};

	const updateNews = async () => {
		const isValid = await form.trigger();
		if (!isValid) {
			// Show specific validation errors to the user
			const errors = form.formState.errors;
			if (errors.title) {
				toast.error(`Title: ${errors.title.message}`);
			}
			if (errors.content) {
				toast.error(`Content: ${errors.content.message}`);
			}
			return;
		}

		await handleSubmit();
	};

	const handleSubmit = async () => {
		try {
			setIsSubmitting(true);

			const values = form.getValues();

			// Prepare data for server action
			const updateData: {
				title: string;
				content: string;
				excludedCustomers: string[];
				removedImage: boolean;
				existingPdfIds: string[];
				pdfs: File[];
				image?: File;
			} = {
				...values,
				excludedCustomers,
				removedImage: imageRemoved,
				existingPdfIds: pdfs
					.filter((pdf) => pdf.s3Key) // Only include existing PDFs with s3Keys
					.map((pdf) => pdf.s3Key as string),
				pdfs: pdfs
					.filter((pdf) => !pdf.s3Key && pdf.file.size > 0) // Only include new PDFs
					.map((pdf) => pdf.file),
			};

			// Add image only if there's a new one
			if (image) {
				updateData.image = image;
			}

			// Call the update action
			const result = await updateNewsAction(news.id, updateData);

			if (result.error) {
				toast.error(result.error);
				return;
			}

			// Success! Reset the hasChanges state
			setHasChanges(false);

			// Revalidate the news cache to update the UI
			mutate(NEWS_CACHE_KEY);

			toast.success("News updated successfully");
		} catch (error) {
			console.error("Error submitting form:", error);
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="h-fit w-full bg-muted rounded-lg  flex flex-col col-span-3">
			<div className="flex flex-col p-4">
				<h2 className="text-lg font-bold">Update News Post</h2>
			</div>
			<form className="flex flex-col gap-4">
				<div className="w-full h-[1px] bg-foreground/10" />
				<ToggleVisibility
					excludedCustomers={excludedCustomers}
					setExcludedCustomers={setExcludedCustomers}
				/>
				<div className="w-full h-[1px] bg-foreground/10" />

				<div className="flex flex-col gap-4 px-4 pb-4">
					<div className="space-y-2">
						<div className="flex flex-row gap-1 items-center">
							<Label htmlFor="title" className="font-medium text-foreground">
								Title
							</Label>
							{form.formState.errors.title && (
								<p className="text-xs text-white bg-destructive px-2 rounded-full ">
									{form.formState.errors.title.message}
								</p>
							)}
						</div>
						<Textarea
							placeholder="Enter news headline"
							value={title}
							onChange={handleTitleChange}
							className={
								form.formState.errors.title
									? "border-destructive bg-destructive/10"
									: ""
							}
						/>
					</div>

					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
						{/* Featured Image Section */}
						<div className="space-y-2">
							<Label className="font-medium text-foreground">
								Featured Image
							</Label>
							<div className="flex flex-col hover:ring-[3px] hover:ring-ring/50 hover:ring-offset-0 hover:border-ring rounded-lg bg-primary-foreground border  border-muted-foreground/20 transition-all  overflow-hidden ">
								{imagePreview ? (
									<div className="group relative w-full">
										<div className="relative aspect-[16/9]">
											<Image
												src={imagePreview}
												alt="Preview"
												fill
												className="object-contain"
											/>
											<div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 rounded-lg">
												<Button
													type="button"
													onClick={handleRemoveImage}
													variant="destructive"
													size="sm"
													className="gap-2"
												>
													<X className="h-4 w-4" />
													Remove Image
												</Button>
											</div>
										</div>
									</div>
								) : (
									<label
										htmlFor="image-upload"
										className="flex aspect-[16/9] w-full cursor-pointer flex-col items-center justify-center gap-2 p-8"
									>
										<Upload className="h-6 w-6 text-muted-foreground" />
										<div className="text-center">
											<p className="text-sm font-medium text-muted-foreground">
												Click to upload image
											</p>
											<p className="text-xs text-muted-foreground/60">
												PNG or JPEG (max. 4MB)
											</p>
										</div>
										<Input
											id="image-upload"
											type="file"
											accept=".png,.jpeg,.jpg"
											onChange={handleImageUpload}
											className="hidden"
										/>
									</label>
								)}
							</div>
						</div>

						{/* PDF Upload Section */}
						<div className="space-y-2">
							<Label className="font-medium text-foreground">
								PDFs ({pdfs.length}/3)
							</Label>
							<div className="aspect-video grid grid-rows-3 gap-2 w-full h-full pb-[28px]">
								{pdfs.map((pdf, index) => (
									<div
										key={pdf.id}
										className="flex items-center justify-between rounded-md border-ring/50 border pl-3 pr-1 h-full transition-colors bg-primary/5"
									>
										<div className="flex items-center gap-3">
											<FileText className="h-4 w-4 shrink-0" />
											<div className="flex flex-col">
												<span className="line-clamp-1 text-sm font-medium text-foreground">
													{pdf.file.name}
												</span>
												<span className="text-xs text-muted-foreground">
													{pdf.file.size > 0
														? formatFileSize(pdf.file.size)
														: ""}
												</span>
											</div>
										</div>
										<div className="flex items-center gap-2 mr-1">
											{pdf.preview && (
												<button
													type="button"
													onClick={() => window.open(pdf.preview, "_blank")}
													className="p-0 group cursor-pointer"
												>
													<ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
												</button>
											)}
											<button
												type="button"
												onClick={() => handleRemovePdf(index)}
												className="p-0 group cursor-pointer"
											>
												<X className="h-4 w-4 text-muted-foreground group-hover:text-red-400" />
											</button>
										</div>
									</div>
								))}

								<label
									htmlFor="pdf-upload"
									className={cn(
										"flex flex-row hover:ring-[3px] hover:ring-ring/50 hover:ring-offset-0 hover:border-ring rounded-lg bg-primary-foreground border border-muted-foreground/20 transition-all cursor-pointer items-center justify-center gap-2 h-full",
										pdfs.length >= 3 && "hidden",
									)}
								>
									<Upload className="h-6 w-6 text-muted-foreground" />
									<div className="text-center">
										<p className="text-sm font-medium text-muted-foreground">
											Click to add PDFs ({pdfs.length}/3)
										</p>
										<p className="text-xs text-muted-foreground/60">
											PDF files (max. 4MB each)
										</p>
									</div>
									<Input
										id="pdf-upload"
										type="file"
										accept=".pdf"
										multiple
										onChange={handlePdfUpload}
										className="hidden"
										disabled={pdfs.length >= 3}
									/>
								</label>
								<div
									className={cn(
										"border h-full border-muted-foreground/20 bg-primary-foreground/40 rounded-lg border-dashed",
										pdfs.length !== 0 && "hidden",
									)}
								/>
								<div
									className={cn(
										"border h-full border-muted-foreground/20 bg-primary-foreground/40 rounded-lg border-dashed",
										pdfs.length >= 2 && "hidden",
									)}
								/>
							</div>
						</div>
					</div>

					<Tiptap
						content={content}
						onChange={handleContentChange}
						form={form}
					/>

					<div className="flex justify-end gap-2 w-full items-center">
						<Button
							type="button"
							variant="default"
							className="cursor-pointer"
							onClick={updateNews}
							disabled={isSubmitting || !hasChanges}
						>
							{isSubmitting ? "Updating..." : "Update News"}
						</Button>
					</div>
				</div>
			</form>
		</div>
	);
};

export default EditNewsForm;
