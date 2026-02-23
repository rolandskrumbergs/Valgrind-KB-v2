"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { useState, useMemo } from "react";
import KnowledgeFileItem from "./knowledge-file-item";
import { Skeleton } from "../ui/skeleton";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { useKnowledgeBaseLite } from "@/hooks/knowledge-base/use-knowledge-base-lite";
import type { KnowledgeBaseFileLite } from "@/hooks/knowledge-base/use-knowledge-base-lite";
import ProcessingStatusBadge from "./processing-status-badge";
import ManageDocumentsLoading from "@/app/@dashboard/(lena)/knowledge-base/_loading/manage-documents-loading";

const ManageDocuments = () => {
	const { knowledgeBaseFiles, isLoading, error } = useKnowledgeBaseLite();

	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [sortMethod, setSortMethod] = useState<string>("newest");

	const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value);
	};

	const filteredAndSortedFiles = useMemo(() => {
		// First filter by search query
		let filtered = knowledgeBaseFiles.filter((file: KnowledgeBaseFileLite) =>
			file.fileName.toLowerCase().includes(searchQuery.toLowerCase()),
		);

		// Then filter by category
		if (selectedCategory && selectedCategory !== "all") {
			filtered = filtered.filter(
				(file: KnowledgeBaseFileLite) => file.category === selectedCategory,
			);
		}

		// Finally sort based on sort method
		return [...filtered].sort((a, b) => {
			switch (sortMethod) {
				case "newest":
					return (
						new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
					);
				case "oldest":
					return (
						new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
					);
				case "name-asc":
					return a.fileName.localeCompare(b.fileName);
				case "name-desc":
					return b.fileName.localeCompare(a.fileName);
				case "size-asc":
					return a.fileSize - b.fileSize;
				case "size-desc":
					return b.fileSize - a.fileSize;
				default:
					return 0;
			}
		});
	}, [knowledgeBaseFiles, searchQuery, selectedCategory, sortMethod]);

	if (isLoading) {
		return <ManageDocumentsLoading />;
	}

	if (error) {
		return (
			<div className="h-full w-full bg-muted rounded-lg p-4 flex justify-center items-center col-span-3">
				<div className="text-center text-destructive">{error.message}</div>
			</div>
		);
	}

	return (
		<div className="h-full w-full bg-muted rounded-lg  flex flex-col col-span-3">
			<div className="flex items-center justify-between h-20 px-4">
				<div className="flex items-start flex-col">
					<div className="flex items-center gap-1">
						<h1 className="text-xl font-semibold">Documents</h1>
						<ProcessingStatusBadge />
					</div>
					<p className="text-sm text-muted-foreground">
						Manage documents in the knowledge base
					</p>
				</div>
			</div>
			<div className="h-12 w-full px-4 flex items-center justify-between">
				<div className="relative w-full max-w-sm">
					<div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
						<Search className="h-4 w-4 text-muted-foreground" />
					</div>
					<input
						type="text"
						className="bg-background border border-input rounded-lg py-2 h-10 pl-10 pr-4 w-full text-sm focus:ring-2 focus:ring-ring focus:border-ring"
						placeholder="Search documents..."
						value={searchQuery}
						onChange={handleSearch}
					/>
				</div>
				<div className="flex items-center gap-2">
					<Select onValueChange={setSelectedCategory} value={selectedCategory}>
						<SelectTrigger className="w-auto bg-background/70">
							<SelectValue placeholder="Category" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Categories</SelectItem>
							<SelectItem value="books">Books</SelectItem>
							<SelectItem value="laws">Laws</SelectItem>
							<SelectItem value="legalcases">Legal Cases</SelectItem>
							<SelectItem value="other">Other</SelectItem>
						</SelectContent>
					</Select>
					<Select onValueChange={setSortMethod} value={sortMethod}>
						<SelectTrigger className="w-auto bg-background/70">
							<SelectValue placeholder="Sort by" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="newest">Newest</SelectItem>
							<SelectItem value="oldest">Oldest</SelectItem>
							<SelectItem value="name-asc">Name (A-Z)</SelectItem>
							<SelectItem value="name-desc">Name (Z-A)</SelectItem>
							<SelectItem value="size-asc">Size (Asc)</SelectItem>
							<SelectItem value="size-desc">Size (Desc)</SelectItem>
							<SelectItem value="processing-first">Processing First</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{filteredAndSortedFiles.length === 0 ? (
				<div className="text-center py-8 text-muted-foreground">
					No documents found. Upload documents to get started.
				</div>
			) : (
				<ScrollArea className="max-h-[calc(100dvh-14rem)] h-full">
					<div className="overflow-hidden flex flex-col gap-4 pb-10 pt-4 px-4">
						{filteredAndSortedFiles.map((file) => (
							<KnowledgeFileItem key={file.id} file={file} />
						))}
					</div>
					<div className="bg-gradient-to-b from-muted to-transparent h-4 absolute top-0 w-full" />
					<div className="bg-gradient-to-t from-muted to-transparent h-10 absolute bottom-0 w-full" />
				</ScrollArea>
			)}
		</div>
	);
};

export default ManageDocuments;
