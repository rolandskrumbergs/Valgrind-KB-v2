"use client";

import {
	AlertCircle,
	CheckCircle,
	ChevronDown,
	ChevronUp,
	Clock,
	Info,
	XCircle,
} from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { cn, formatTimeSince } from "@/lib/utils";
import { useKnowledgeBaseInvocations } from "@/hooks/lena/use-knowledgebase-invocations";
import type { KnowledgeBaseInvocation } from "@/db/schema";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Collapsible } from "../ui/collapsible";
import { CollapsibleContent } from "../ui/collapsible";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type LenaProfile = {
	id: string;
	profileName: string;
	systemPrompt: string;
	topK: number;
	model: string;
	threshold: number;
	thresholdRequiredChunks: number;
	highConfidenceThreshold: number;
	requiredHighConfidenceChunks: number;
};

type FetchedChunk = {
	text: string;
	score: number;
	documentId: string;
	chunkId: string;
	knowledgeCategory: string;
	reasoning: string;
};

const ListKnowledgeBaseInvocations = () => {
	const { functionInvocations, isLoading, error } =
		useKnowledgeBaseInvocations();
	const [statusFilter, setStatusFilter] = useState<"all" | "error" | "success">(
		"error",
	);

	if (isLoading) {
		return (
			<div className="h-full w-full bg-muted rounded-lg p-4 col-span-3">
				Loading...
			</div>
		);
	}

	if (error) {
		return (
			<div className="h-full w-full bg-muted rounded-lg p-4 col-span-3">
				<div className="text-center text-destructive">{error.message}</div>
			</div>
		);
	}

	// Filter invocations based on status
	const filteredInvocations = functionInvocations.filter((invocation) => {
		if (statusFilter === "all") return true;
		return invocation.status === statusFilter;
	});

	return (
		<div className="h-full w-full bg-muted rounded-lg  flex flex-col">
			<div className="flex items-center justify-between h-fit mb-4 p-4">
				<div className="flex items-start flex-col">
					<h1 className="text-xl font-semibold">
						Knowledge Base Notifications
					</h1>
					<p className="text-sm text-muted-foreground">
						List of all the times Lena was unable to find the answer in the
						knowledge base.
					</p>
				</div>
				<div className="px-4">
					<RadioGroup
						value={statusFilter}
						onValueChange={(value) =>
							setStatusFilter(value as "all" | "error" | "success")
						}
						className="flex flex-row items-center gap-4"
					>
						<div className="flex items-center space-x-2">
							<RadioGroupItem value="all" id="all" />
							<Label htmlFor="all">All</Label>
						</div>
						<div className="flex items-center space-x-2">
							<RadioGroupItem value="error" id="error" />
							<Label htmlFor="error" className="flex items-center gap-1.5">
								<AlertCircle className="h-3.5 w-3.5 text-destructive" />
								Errors
							</Label>
						</div>
						<div className="flex items-center space-x-2">
							<RadioGroupItem value="success" id="success" />
							<Label htmlFor="success" className="flex items-center gap-1.5">
								<CheckCircle className="h-3.5 w-3.5 text-green-500" />
								Success
							</Label>
						</div>
					</RadioGroup>
				</div>
			</div>
			{/* Filter */}
			<ScrollArea className="max-h-[calc(100dvh-11rem)] h-full rounded-lg px-4">
				<div className="gap-4 flex flex-col ">
					{filteredInvocations.length === 0 ? (
						<div className="p-4 text-center">
							No knowledge base invocations found
						</div>
					) : (
						filteredInvocations.map((knowledgeBaseInvocation) => (
							<KnowledgeBaseInvocationCard
								key={knowledgeBaseInvocation.id}
								knowledgeBaseInvocation={knowledgeBaseInvocation}
							/>
						))
					)}
				</div>
			</ScrollArea>
		</div>
	);
};

export default ListKnowledgeBaseInvocations;

const KnowledgeBaseInvocationCard = ({
	knowledgeBaseInvocation,
}: {
	knowledgeBaseInvocation: KnowledgeBaseInvocation;
}) => {
	const [isExtended, setIsExtended] = useState(false);

	return (
		<div
			key={knowledgeBaseInvocation.id}
			className="w-full text-left bg-muted-foreground/20 flex flex-col items-start justify-between rounded-md overflow-hidden border border-border"
		>
			<div
				className={cn(
					"text-sm px-3 py-3 gap-2 flex flex-row items-center justify-between w-full",
					knowledgeBaseInvocation.status === "error"
						? "bg-destructive/80 border-border/40 border-b"
						: "border-border/70 border-b",
				)}
			>
				<div className="flex flex-row items-center gap-2">
					{knowledgeBaseInvocation.status === "error" ? (
						<AlertCircle className="w-4 h-4" />
					) : (
						<CheckCircle className="w-4 h-4" />
					)}
					<p className="text-sm">
						{knowledgeBaseInvocation.type === "system-error"
							? "System Error when searching knowledge base"
							: knowledgeBaseInvocation.type === "insufficient-data"
								? "Insufficient data when answering user question"
								: "Successfully searched knowledge base"}
					</p>
				</div>
				<div className="flex flex-row items-center gap-2">
					<Clock className="w-4 h-4" />
					<p className="text-sm">
						{knowledgeBaseInvocation.createdAt.toLocaleDateString("en-US", {
							weekday: "short",
							day: "numeric",
							month: "short",
							year: "numeric",
						})}
					</p>
					<span className="text-xs text-foreground">
						({formatTimeSince(knowledgeBaseInvocation.createdAt)})
					</span>
				</div>
			</div>

			<div className="p-3 w-full flex flex-col">
				<div className="flex flex-col gap-2">
					<p className="text-sm rounded-md">
						{knowledgeBaseInvocation.conversationSummary}
					</p>

					<div className="w-full">
						<p className="text-muted-foreground text-sm">
							Lena Searched Knowledge Base for
						</p>
						<p className="text-sm">{knowledgeBaseInvocation.searchQuery}</p>
					</div>

					<div className="w-full">
						<p className="text-muted-foreground text-sm">Reason</p>
						<p className="text-sm text-foreground">
							{knowledgeBaseInvocation.result}
						</p>
					</div>
					<div className="flex flex-row gap-2 items-center w-full">
						<div className="flex flex-row gap-2 items-center text-sm justify-center text-foreground bg-muted px-3 py-1 rounded-md w-fit cursor-pointer hover:text-foreground">
							User: {knowledgeBaseInvocation.userName}
						</div>
						<div className="flex flex-row gap-2 items-center text-sm justify-center text-foreground bg-muted px-3 py-1 rounded-md w-fit cursor-pointer hover:text-foreground">
							Chat ID: {knowledgeBaseInvocation.chatId}
						</div>
						<button
							type="button"
							className="flex flex-row gap-2 items-center justify-center bg-muted px-3 py-1 rounded-md w-fit cursor-pointer text-muted-foreground hover:text-foreground"
							onClick={() => setIsExtended(!isExtended)}
						>
							<p className="text-sm text-foreground">
								{isExtended ? "Hide Details" : "View Details"}
							</p>
							{isExtended ? (
								<ChevronUp className="h-4 w-4" />
							) : (
								<ChevronDown className="h-4 w-4" />
							)}
						</button>
					</div>
				</div>

				<Collapsible open={isExtended} onOpenChange={setIsExtended}>
					<CollapsibleContent className="mt-2 flex flex-col gap-6 w-full items-center">
						<div className="flex flex-col gap-2 items-center max-w-xl">
							<div className="flex flex-row gap-2 items-center text-sm justify-center text-foreground bg-muted px-3 py-1 rounded-md w-fit">
								Lena Profile
							</div>
							<p className="text-sm text-foreground text-center">
								Lena used the following profile to search the knowledge base:
							</p>
							<div className="flex flex-col gap-2 border border-border/20 bg-muted/20 p-3 rounded-md w-fit">
								<p className="text-sm text-foreground text-center font-bold">
									{knowledgeBaseInvocation.lenaProfile?.profileName}
								</p>
								<p className="text-sm text-foreground text-center">
									No of chunks to fetch from each category:{" "}
									<span className="font-medium text-foreground bg-muted/60 px-1.5 py-0.5 rounded-md">
										{knowledgeBaseInvocation.lenaProfile?.topK}
									</span>
								</p>
								<p className="text-sm text-foreground text-center">
									Minimum Confidence Score:{" "}
									<span className="font-medium text-foreground bg-muted/60 px-1.5 py-0.5 rounded-md">
										{knowledgeBaseInvocation.lenaProfile?.threshold}
									</span>
								</p>
								<p className="text-sm text-foreground text-center">
									Minimum Confidence Required Chunks:{" "}
									<span className="font-medium text-foreground bg-muted/60 px-1.5 py-0.5 rounded-md">
										{
											knowledgeBaseInvocation.lenaProfile
												?.thresholdRequiredChunks
										}
									</span>
								</p>
								<p className="text-sm text-foreground text-center">
									High Confidence Score:{" "}
									<span className="font-medium text-foreground bg-muted/60 px-1.5 py-0.5 rounded-md">
										{
											knowledgeBaseInvocation.lenaProfile
												?.highConfidenceThreshold
										}
									</span>
								</p>
								<p className="text-sm text-foreground text-center">
									High Confidence Required Chunks:{" "}
									<span className="font-medium text-foreground bg-muted/60 px-1.5 py-0.5 rounded-md">
										{
											knowledgeBaseInvocation.lenaProfile
												?.requiredHighConfidenceChunks
										}
									</span>
								</p>
							</div>
						</div>
						<div className="flex flex-col gap-2 items-center max-w-xl">
							<div className="flex flex-row gap-2 items-center text-sm justify-center text-foreground bg-muted px-3 py-1 rounded-md w-fit">
								Fetched Chunks
							</div>
							<p className="text-sm text-foreground text-center">
								Lena fetched a total of{" "}
								<span className="font-medium text-foreground bg-muted/60 px-1.5 py-0.5 rounded-md">
									{
										(knowledgeBaseInvocation.fetchedChunks as FetchedChunk[])
											.length
									}
								</span>{" "}
								chunks from the knowledge base. <br />
								<span className="font-medium text-foreground bg-muted/60 px-1.5 py-0.5 rounded-md">
									{knowledgeBaseInvocation.lenaProfile?.topK}
								</span>{" "}
								from each of the knowledge categories.
							</p>
							<p className="text-sm text-foreground text-center">
								After fetching the chunks, Lena graded each chunk on a scale of
								1 (low confidence) to 10 (high confidence) based on its
								relevance to the conversation and the user question.
							</p>
						</div>
						<div className="w-full flex flex-col gap-2 items-center">
							<div className="w-full flex flex-row gap-6 items-center justify-center">
								{Object.entries(
									(
										knowledgeBaseInvocation.fetchedChunks as FetchedChunk[]
									).reduce<Record<string, FetchedChunk[]>>((acc, chunk) => {
										const category = chunk.knowledgeCategory || "Uncategorized";
										if (!acc[category]) {
											acc[category] = [];
										}
										acc[category].push(chunk);
										return acc;
									}, {}),
								).map(([category, chunks]) => (
									<div key={category} className="space-y-1">
										<p className="text-sm capitalize text-muted-foreground">
											{category}
										</p>
										<div className="flex flex-col gap-2">
											{chunks.map((chunk: FetchedChunk) => {
												const lenaProfile =
													knowledgeBaseInvocation.lenaProfile as LenaProfile;
												const threshold = lenaProfile?.threshold || 0;
												const highConfidenceThreshold =
													lenaProfile?.highConfidenceThreshold || 0;

												let chunkColorClass = "bg-muted/80";
												if (chunk.score >= highConfidenceThreshold) {
													chunkColorClass =
														"bg-emerald-500/20 border border-emerald-500/50";
												} else if (chunk.score >= threshold) {
													chunkColorClass =
														"bg-amber-500/20 border border-amber-500/50";
												}

												return (
													<Dialog key={chunk.chunkId}>
														<DialogTrigger asChild>
															<div
																key={chunk.chunkId}
																className={`${chunkColorClass} px-3 py-2 rounded-md flex flex-row items-center gap-2 cursor-pointer hover:ring-2 hover:ring-white/20 transition-all duration-200`}
															>
																<p className="text-xs text-muted-foreground">
																	Score: {chunk.score}
																</p>
															</div>
														</DialogTrigger>
														<DialogContent className="p-0">
															<DialogHeader className="p-4">
																<DialogTitle>
																	Chunk {chunks.indexOf(chunk) + 1} of{" "}
																	{chunks.length} from {category}
																</DialogTitle>
															</DialogHeader>
															<ScrollArea className="max-h-[70vh] overflow-y-auto w-full p-4 pt-0">
																<div className="flex flex-col gap-3">
																	<div className="text font-bold text-foreground">
																		Reasoning:{" "}
																		<p className="text-sm font-normal">
																			{chunk.reasoning}
																		</p>
																	</div>
																	<div className="flex flex-row gap-2 items-center font-bold">
																		Confidence Score:{" "}
																		<p className=" font-normal">
																			{chunk.score}
																		</p>
																	</div>
																	<div className="flex flex-col gap-2">
																		<p className="font-bold">Chunk Content</p>
																		<p className="text-xs font-normal text-foreground bg-muted/80 p-3 rounded-md">
																			{chunk.text}
																		</p>
																	</div>
																</div>
															</ScrollArea>
														</DialogContent>
													</Dialog>
												);
											})}
										</div>
									</div>
								))}
							</div>
							<div className="text-xs text-muted-foreground flex flex-row items-center gap-2 bg-muted px-2 py-1 rounded-md w-fit">
								<Info className="w-4 h-4" /> Click on a chunk to view the
								details.
							</div>
						</div>
						<div className="w-full flex flex-col gap-5 items-center">
							<div className="flex flex-col gap-2 items-center max-w-xl">
								<div className="flex flex-row gap-2 items-center text-sm justify-center  text-foreground bg-muted px-3 py-1 rounded-md w-fit">
									Condition
								</div>
								<p className="text-sm text-foreground text-center">
									Both Condition 1 and Condition 2 must be met for Lena to
									answer the user question. If either of the conditions are not
									met, Lena will not be able to answer the user question.
								</p>
							</div>

							{knowledgeBaseInvocation.lenaProfile?.threshold &&
								knowledgeBaseInvocation.lenaProfile
									?.highConfidenceThreshold && (
									<div className="flex flex-row gap-4">
										<div className="flex flex-col gap-2 bg-muted/80 p-4 rounded-md w-fit relative">
											<div className="flex items-center justify-between w-full">
												<p className="text-sm font-medium text-foreground">
													Condition 1
												</p>
												<div className="rounded-full text-xs bg-background px-2 py-0.5 flex items-center gap-1">
													{(
														knowledgeBaseInvocation.fetchedChunks as FetchedChunk[]
													).filter(
														(chunk) =>
															chunk.score >=
															(knowledgeBaseInvocation.lenaProfile?.threshold ||
																0),
													).length >=
													(knowledgeBaseInvocation.lenaProfile
														?.thresholdRequiredChunks || 0) ? (
														<span className="text-emerald-500 font-medium flex flex-row items-center gap-1 py-1">
															<CheckCircle className="w-3 h-3" />
															Passed
														</span>
													) : (
														<span className="text-red-500 font-medium flex flex-row items-center gap-1 py-1">
															<XCircle className="w-3 h-3" />
															Failed
														</span>
													)}
												</div>
											</div>

											<div className="flex flex-col gap-2 text-sm">
												<div className="flex flex-row items-center gap-1">
													<span>Required at least</span>
													<span className="font-bold px-1">
														{
															knowledgeBaseInvocation.lenaProfile
																?.thresholdRequiredChunks
														}
													</span>
													<span>chunks with score ≥</span>
													<span className="font-bold">
														{knowledgeBaseInvocation.lenaProfile?.threshold}
													</span>
												</div>

												<div className="flex items-center gap-1">
													<span className="w-3 h-3 rounded-full bg-amber-500/50" />
													<span>Found</span>
													<span className="font-bold">
														{
															(
																knowledgeBaseInvocation.fetchedChunks as FetchedChunk[]
															).filter(
																(chunk) =>
																	chunk.score >=
																	(knowledgeBaseInvocation.lenaProfile
																		?.threshold || 0),
															).length
														}
													</span>
													<span>matching chunks</span>
												</div>
											</div>
										</div>

										<div className="flex flex-col gap-2 bg-muted/80 p-4 rounded-md w-fit relative">
											<div className="flex items-center justify-between w-full">
												<p className="text-sm font-medium text-foreground">
													Condition 2
												</p>
												<div className="rounded-full text-xs bg-background px-2 py-0.5 flex items-center gap-1">
													{(
														knowledgeBaseInvocation.fetchedChunks as FetchedChunk[]
													).filter(
														(chunk) =>
															chunk.score >=
															(knowledgeBaseInvocation.lenaProfile
																?.highConfidenceThreshold || 0),
													).length >=
													(knowledgeBaseInvocation.lenaProfile
														?.requiredHighConfidenceChunks || 0) ? (
														<span className="text-emerald-500 font-medium flex flex-row items-center gap-1 py-1">
															<CheckCircle className="w-3 h-3" />
															Passed
														</span>
													) : (
														<span className="text-red-500 font-medium flex flex-row items-center gap-1 py-1">
															<XCircle className="w-3 h-3" />
															Failed
														</span>
													)}
												</div>
											</div>

											<div className="flex flex-col gap-2 text-sm">
												<div className="flex flex-row items-center gap-1">
													<span>Required at least</span>
													<span className="font-bold px-1">
														{
															knowledgeBaseInvocation.lenaProfile
																?.requiredHighConfidenceChunks
														}
													</span>
													<span>chunks with score ≥</span>
													<span className="font-bold">
														{
															knowledgeBaseInvocation.lenaProfile
																?.highConfidenceThreshold
														}
													</span>
												</div>

												<div className="flex items-center gap-1">
													<span className="w-3 h-3 rounded-full bg-emerald-500/50" />
													<span>Found</span>
													<span className="font-bold">
														{
															(
																knowledgeBaseInvocation.fetchedChunks as FetchedChunk[]
															).filter(
																(chunk) =>
																	chunk.score >=
																	(knowledgeBaseInvocation.lenaProfile
																		?.highConfidenceThreshold || 0),
															).length
														}
													</span>
													<span>matching chunks</span>
												</div>
											</div>
										</div>
									</div>
								)}
						</div>
					</CollapsibleContent>
				</Collapsible>
			</div>
		</div>
	);
};
