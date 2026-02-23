import { cn, formatFileSize } from "@/lib/utils";
import type { AddNewsFormType } from "@/schema";
import { addNewsFormSchema } from "@/schema";
import { FileText, Upload, X } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import Tiptap from "./tiptap-editor";
import Image from "next/image";
import NewsVisibility from "./news-visibility";
import { addNews } from "@/actions/news-actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { mutate } from "swr";
import { NEWS_CACHE_KEY } from "@/constants/cache-keys";
import { Textarea } from "../ui/textarea";

interface PDFFile {
	file: File;
	preview: string;
	id: string;
}

const AddNewsForm = ({ setOpen }: { setOpen: (open: boolean) => void }) => {
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [image, setImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [pdfs, setPdfs] = useState<PDFFile[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [excludedCustomers, setExcludedCustomers] = useState<string[]>([]);

	// Form validation with zod
	const form = useForm<AddNewsFormType>({
		resolver: zodResolver(addNewsFormSchema),
		defaultValues: {
			title: "",
			content: "",
		},
	});

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

	// Memoize the excluded customers change handler to prevent rerenders
	const handleExcludedCustomersChange = useCallback(
		(excludedCustomerIds: string[]) => {
			// We're directly storing the excluded customers IDs (not the visible ones)
			setExcludedCustomers(excludedCustomerIds);
		},
		[],
	);

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
		const reader = new FileReader();
		reader.onloadend = () => {
			setImagePreview(reader.result as string);
		};
		reader.readAsDataURL(file);
	};

	const handleRemoveImage = () => {
		setImage(null);
		setImagePreview(null);
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

	const saveAsDraft = async () => {
		const isValid = await form.trigger();
		if (!isValid) {
			toast.error("Please fill in all required fields");
			return;
		}

		await handleSubmit("draft");
	};

	const publishNews = async () => {
		const isValid = await form.trigger();
		if (!isValid) {
			toast.error("Please fill in all required fields");
			return;
		}

		await handleSubmit("published");
	};

	const handleSubmit = async (status: "draft" | "published") => {
		try {
			setIsSubmitting(true);

			const values = form.getValues();

			// Submit the form data along with files to the server action
			const result = await addNews({
				...values,
				excludedCustomers,
				image,
				pdfs: pdfs.map((pdf) => pdf.file),
				status,
			});

			if (result.error) {
				toast.error(result.error);
				return;
			}

			mutate(NEWS_CACHE_KEY);

			toast.success(
				`News ${status === "draft" ? "saved as draft" : "published"} successfully`,
			);
			setOpen(false);
		} catch (error) {
			console.error("Error submitting form:", error);
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="flex flex-col">
			<div className="flex flex-col border-b pb-4 border-white/5 p-4">
				<h2 className="text-lg font-bold">Create News</h2>
				<p className="text-sm text-muted-foreground">
					Add a new news post to Ibben
				</p>
			</div>
			<form className="flex flex-col gap-4 p-4 bg-muted">
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
						<div className="flex flex-col hover:ring-[3px] hover:ring-ring/50 hover:ring-offset-0 hover:border-ring rounded-lg bg-primary-foreground border  border-muted-foreground/20 transition-all  overflow-hidden aspect-video">
							{imagePreview ? (
								<div className="relative group h-full">
									<Image
										src={imagePreview}
										alt="Preview"
										fill
										className="object-contain"
									/>
									<div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 backdrop-blur-xs transition-opacity group-hover:opacity-100 rounded-lg">
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
							) : (
								<label
									htmlFor="image-upload"
									className="flex w-full cursor-pointer flex-row items-center justify-center gap-2 p-8 h-full"
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
							Add PDFs ({pdfs.length}/3)
						</Label>
						<div className="aspect-video grid grid-rows-3 gap-2 w-full h-full pb-[28px]">
							{pdfs.map((pdf, index) => (
								<div
									key={pdf.id}
									className="group flex items-center justify-between rounded-md border-ring/50 border px-3 h-full transition-colors bg-primary/5"
								>
									<div className="flex items-center gap-3">
										<FileText className="h-4 w-4 shrink-0" />
										<div className="flex flex-col">
											<span className="line-clamp-1 text-sm font-medium text-foreground">
												{pdf.file.name}
											</span>
											<span className="text-xs text-zinc-400">
												{formatFileSize(pdf.file.size)}
											</span>
										</div>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => handleRemovePdf(index)}
										className="h-7 w-7 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/10"
									>
										<X className="h-4 w-4 text-zinc-400 hover:text-red-400" />
									</Button>
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

				<Tiptap content={content} onChange={handleContentChange} form={form} />

				<NewsVisibility onChange={handleExcludedCustomersChange} />

				<div className="flex justify-end gap-2 w-full items-center">
					<Button
						type="button"
						variant="outline"
						onClick={() => setOpen(false)}
						className="cursor-pointer"
						disabled={isSubmitting}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="default"
						className="cursor-pointer"
						onClick={saveAsDraft}
						disabled={isSubmitting}
					>
						{isSubmitting ? "Saving..." : "Save Draft"}
					</Button>
					<Button
						type="button"
						variant="default"
						className="cursor-pointer"
						onClick={publishNews}
						disabled={isSubmitting}
					>
						{isSubmitting ? "Publishing..." : "Publish News"}
					</Button>
				</div>
			</form>
		</div>
	);
};

export default AddNewsForm;
